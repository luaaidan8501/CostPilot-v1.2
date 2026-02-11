"use client"

import type React from "react"
import { useMemo, useState, useRef } from "react"
import { useAddReceipts, usePurchases, useReceipts, useSavePurchase } from "@/lib/hooks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CameraIcon, PlusIcon, TrashIcon } from "@/components/icons"
import type { Purchase, Receipt, ReceiptItem } from "@/lib/types"

export default function PurchasesPage() {
  const [purchaseType, setPurchaseType] = useState<"invoice" | "camera" | "quick" | "manual">("quick")
  const [cameraActive, setCameraActive] = useState(false)
  const [photoCapture, setPhotoCapture] = useState<string | null>(null)
  const { data: purchases } = usePurchases()
  const { data: receipts } = useReceipts()
  const savePurchase = useSavePurchase()
  const addReceipts = useAddReceipts()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [quickAddForm, setQuickAddForm] = useState({
    ingredient: "",
    quantity: "",
    unit: "kg",
    totalPrice: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    type: "Regular",
  })

  const [reviewReceipts, setReviewReceipts] = useState<Receipt[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null)

  const weeklyReceipts = useMemo(() => {
    return receipts.reduce<Record<string, Receipt[]>>((acc, receipt) => {
      const key = receipt.weekStart.toISOString().slice(0, 10)
      if (!acc[key]) acc[key] = []
      acc[key].push(receipt)
      return acc
    }, {})
  }, [receipts])

  const weeks = useMemo(() => Object.keys(weeklyReceipts).sort().reverse(), [weeklyReceipts])

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quickAddForm.ingredient || !quickAddForm.quantity || !quickAddForm.totalPrice) {
      alert("Please fill in all fields")
      return
    }

    const newPurchase: Purchase = {
      id: `purchase_${Date.now()}`,
      date: new Date(quickAddForm.date),
      ingredientId: `ing_${Date.now()}`,
      ingredientName: quickAddForm.ingredient,
      quantity: parseFloat(quickAddForm.quantity),
      unit: quickAddForm.unit,
      totalPrice: parseFloat(quickAddForm.totalPrice),
      unitPrice: parseFloat(quickAddForm.totalPrice) / parseFloat(quickAddForm.quantity),
      supplierId: `sup_${Date.now()}`,
      supplier: quickAddForm.supplier || "Unknown",
      type: quickAddForm.type as "Regular" | "Emergency",
    }

    savePurchase(newPurchase)

    // Reset form
    setQuickAddForm({
      ingredient: "",
      quantity: "",
      unit: "kg",
      totalPrice: "",
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      type: "Regular",
    })

    alert("Purchase logged successfully!")
  }

  const getWeekStart = (date: Date) => {
    const normalized = new Date(date)
    const day = normalized.getDay()
    const diff = day === 0 ? -6 : 1 - day
    normalized.setDate(normalized.getDate() + diff)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  const parseReceiptWithTextract = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/receipts/parse", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || "Failed to parse receipt")
    }

    return response.json() as Promise<{
      items: ReceiptItem[]
      receiptDate?: string
      fileUrl?: string
    }>
  }

  const handleReceiptUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const uploadedAt = new Date()
    const parsedReceipts: Receipt[] = []

    for (const file of Array.from(files)) {
      try {
        const parsed = await parseReceiptWithTextract(file)
        const receiptDate = parsed.receiptDate ? new Date(parsed.receiptDate) : uploadedAt
        parsedReceipts.push({
          id: `receipt_${Date.now()}_${file.name}`,
          fileName: file.name,
          fileUrl: parsed.fileUrl,
          uploadedAt,
          receiptDate,
          weekStart: getWeekStart(receiptDate),
          items: parsed.items,
        })
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to parse receipt")
      }
    }

    if (parsedReceipts.length > 0) {
      setReviewReceipts(parsedReceipts)
      setReviewOpen(true)
    }
  }

  const updateReceiptItem = (
    receiptId: string,
    itemId: string,
    field: keyof ReceiptItem,
    value: string
  ) => {
    setReviewReceipts((current) =>
      current.map((receipt) => {
        if (receipt.id !== receiptId) return receipt
        return {
          ...receipt,
          items: receipt.items.map((item) => {
            if (item.id !== itemId) return item
            const updated = { ...item, [field]: value }
            if (field === "quantity" || field === "unitPrice") {
              const qty = field === "quantity" ? Number(value) : updated.quantity
              const price = field === "unitPrice" ? Number(value) : updated.unitPrice
              updated.totalPrice = Number(qty) * Number(price)
            }
            if (field === "totalPrice") {
              const qty = Number(updated.quantity) || 1
              updated.unitPrice = Number(value) / qty
            }
            return updated
          }),
        }
      })
    )
  }

  const handleSaveReceipts = () => {
    const sanitized = reviewReceipts.map((receipt) => ({
      ...receipt,
      items: receipt.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    }))
    addReceipts(sanitized)
    sanitized.forEach((receipt) => {
      receipt.items.forEach((item) => {
        const unitPrice = Number(item.unitPrice)
        const quantity = Number(item.quantity)
        const totalPrice = Number(item.totalPrice)
        savePurchase({
          id: `purchase_${Date.now()}_${item.id}`,
          date: receipt.receiptDate || receipt.uploadedAt,
          ingredientId: `ing_${item.sku || item.id}`,
          ingredientName: item.name,
          quantity,
          unit: item.unit,
          totalPrice: Number.isFinite(totalPrice) ? totalPrice : unitPrice * quantity,
          unitPrice: Number.isFinite(unitPrice) ? unitPrice : totalPrice / (quantity || 1),
          supplierId: `sup_receipt_${receipt.id}`,
          supplier: "Receipt Upload",
          type: "Regular",
        })
      })
    })
    setReviewOpen(false)
    setReviewReceipts([])
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      console.error("Camera access denied:", error)
      alert("Camera access is required for this feature")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const photoData = canvasRef.current.toDataURL("image/jpeg")
        setPhotoCapture(photoData)
        stopCamera()
      }
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Log Purchases</h1>
        <p className="text-slate-600 mt-1">Upload this week's invoices all at once or add items manually</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add Purchase Data</CardTitle>
            <CardDescription>Choose how you want to log your purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={purchaseType} onValueChange={(v) => setPurchaseType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="invoice">Uploads</TabsTrigger>
                <TabsTrigger value="camera">Camera Scan</TabsTrigger>
                <TabsTrigger value="quick">Quick Add</TabsTrigger>
              </TabsList>

              <TabsContent value="invoice" className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    id="invoice-upload"
                    onChange={(event) => {
                      handleReceiptUpload(event.target.files)
                      event.currentTarget.value = ""
                    }}
                  />
                  <label htmlFor="invoice-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="text-4xl">📄</div>
                      <p className="text-lg font-medium">Upload Invoices</p>
                      <p className="text-sm text-slate-500">Drop multiple images or PDFs here, or click to select</p>
                      <p className="text-xs text-slate-400">We'll organize them by date for you</p>
                    </div>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Invoices
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Which month are these invoices from?</Label>
                  <Select defaultValue="this-week">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-month">This month (Jan 2026)</SelectItem>
                      <SelectItem value="last-month">Last month (Dec 2025)</SelectItem>
                      <SelectItem value="two-months">2 months ago (Nov 2025)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  💡 <span className="font-medium">Tip:</span> Upload all your monthly invoices at once. Our system will
                  parse the items and dates automatically.
                </div>
                <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogContent className="max-w-6xl">
                    <DialogHeader>
                      <DialogTitle>Review Parsed Invoices</DialogTitle>
                      <DialogDescription>
                        Confirm quantities, units, SKUs, and prices before saving.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                      {reviewReceipts.map((receipt) => (
                        <div key={receipt.id} className="space-y-3">
                          <div>
                            <p className="font-medium">{receipt.fileName}</p>
                            <p className="text-xs text-slate-500">
                              Uploaded {receipt.uploadedAt.toLocaleString()}
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <Table className="table-fixed w-full">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-40">SKU</TableHead>
                                  <TableHead className="w-[260px]">Item</TableHead>
                                  <TableHead className="w-32 text-right">Qty</TableHead>
                                  <TableHead className="w-32 text-right">Unit</TableHead>
                                  <TableHead className="w-40 text-right">Unit Price</TableHead>
                                  <TableHead className="w-40 text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {receipt.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell className="w-40">
                                      <Input
                                        className="w-full"
                                        value={item.sku}
                                        onChange={(e) =>
                                          updateReceiptItem(receipt.id, item.id, "sku", e.target.value)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="min-w-[260px]">
                                      <Input
                                        className="w-full"
                                        value={item.name}
                                        onChange={(e) =>
                                          updateReceiptItem(receipt.id, item.id, "name", e.target.value)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="w-32">
                                      <Input
                                        type="number"
                                        className="w-full text-right"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateReceiptItem(receipt.id, item.id, "quantity", e.target.value)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="w-32">
                                      <Select
                                        value={item.unit}
                                        onValueChange={(value) =>
                                          updateReceiptItem(receipt.id, item.id, "unit", value)
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="kg">kg</SelectItem>
                                          <SelectItem value="g">g</SelectItem>
                                          <SelectItem value="L">L</SelectItem>
                                          <SelectItem value="mL">mL</SelectItem>
                                          <SelectItem value="pc">pc</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="w-40">
                                      <Input
                                        type="number"
                                        className="w-full text-right"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                          updateReceiptItem(receipt.id, item.id, "unitPrice", e.target.value)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="w-40">
                                      <Input
                                        type="number"
                                        className="w-full text-right"
                                        value={item.totalPrice}
                                        onChange={(e) =>
                                          updateReceiptItem(receipt.id, item.id, "totalPrice", e.target.value)
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setReviewOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSaveReceipts}>
                        Save Invoices
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="camera" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Camera Scanner</CardTitle>
                    <CardDescription>Take a photo of your invoice using your device camera</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!cameraActive && !photoCapture ? (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center">
                        <CameraIcon className="w-12 h-12 text-slate-400 mb-4" />
                        <p className="text-slate-600 font-medium mb-2">Start Camera</p>
                        <p className="text-slate-500 text-sm text-center mb-4">
                          Point your device camera at the invoice
                        </p>
                        <Button onClick={startCamera} className="bg-teal-600 hover:bg-teal-700">
                          <CameraIcon className="w-4 h-4 mr-2" />
                          Open Camera
                        </Button>
                      </div>
                    ) : cameraActive ? (
                      <div className="space-y-4">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full rounded-lg border border-slate-300 bg-slate-900"
                        />
                        <div className="flex gap-2">
                          <Button onClick={capturePhoto} className="flex-1 bg-teal-600 hover:bg-teal-700">
                            Capture Photo
                          </Button>
                          <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : photoCapture ? (
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-slate-700">Photo Captured</p>
                        <img
                          src={photoCapture || "/placeholder.svg"}
                          alt="Captured invoice"
                          className="w-full rounded-lg border border-slate-300"
                        />
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-teal-600 hover:bg-teal-700">Process Invoice</Button>
                          <Button
                            onClick={() => {
                              setPhotoCapture(null)
                              startCamera()
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Retake
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                      <p>
                        Take a clear photo of the entire invoice. Our system will extract items and prices
                        automatically.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quick" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Add Purchase</CardTitle>
                    <CardDescription>Quickly log a single ingredient purchase</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleQuickAdd} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quick-date">Date</Label>
                          <Input
                            id="quick-date"
                            type="date"
                            value={quickAddForm.date}
                            onChange={(e) => setQuickAddForm({ ...quickAddForm, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quick-ingredient">Ingredient *</Label>
                          <Input
                            id="quick-ingredient"
                            placeholder="e.g., Chicken Thigh"
                            value={quickAddForm.ingredient}
                            onChange={(e) => setQuickAddForm({ ...quickAddForm, ingredient: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quick-quantity">Quantity *</Label>
                          <Input
                            id="quick-quantity"
                            type="number"
                            placeholder="e.g., 5"
                            step="0.01"
                            value={quickAddForm.quantity}
                            onChange={(e) => setQuickAddForm({ ...quickAddForm, quantity: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quick-unit">Unit</Label>
                          <Select
                            value={quickAddForm.unit}
                            onValueChange={(value) => setQuickAddForm({ ...quickAddForm, unit: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="mL">mL</SelectItem>
                              <SelectItem value="pc">pc</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quick-price">Total Price (₱) *</Label>
                          <Input
                            id="quick-price"
                            type="number"
                            placeholder="e.g., 500"
                            step="0.01"
                            value={quickAddForm.totalPrice}
                            onChange={(e) => setQuickAddForm({ ...quickAddForm, totalPrice: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quick-supplier">Supplier</Label>
                          <Input
                            id="quick-supplier"
                            placeholder="e.g., Golden Poultry"
                            value={quickAddForm.supplier}
                            onChange={(e) => setQuickAddForm({ ...quickAddForm, supplier: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="quick-type">Type</Label>
                          <Select
                            value={quickAddForm.type}
                            onValueChange={(value) => setQuickAddForm({ ...quickAddForm, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Regular">Regular</SelectItem>
                              <SelectItem value="Emergency">Emergency / Palengke</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="quick-estimated" className="rounded" />
                        <Label htmlFor="quick-estimated" className="text-sm text-slate-600">
                          Mark as estimated
                        </Label>
                      </div>
                      <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Purchase
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>Last purchases logged</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-slate-600">
                        {new Date(purchase.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="font-medium">{purchase.ingredientName}</TableCell>
                      <TableCell className="text-slate-600">{purchase.supplier}</TableCell>
                      <TableCell className="text-right">
                        {purchase.quantity} {purchase.unit}
                      </TableCell>
                      <TableCell className="text-right">₱ {purchase.unitPrice}</TableCell>
                      <TableCell className="text-right font-medium">₱ {purchase.totalPrice}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {weeks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Invoices</CardTitle>
            <CardDescription>Grouped by week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeks.map((week) => (
              <div key={week} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Week of {week}</p>
                    <p className="text-xs text-slate-500">
                      {weeklyReceipts[week].length} invoice(s)
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {weeklyReceipts[week].map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{receipt.fileName}</p>
                        <p className="text-xs text-slate-500">
                          {receipt.items.length} items •{" "}
                          {(receipt.receiptDate || receipt.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {receipt.fileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(receipt.fileUrl, "_blank")}
                          >
                            Open File
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setViewReceipt(receipt)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(viewReceipt)} onOpenChange={(open) => !open && setViewReceipt(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {viewReceipt?.fileName || "Invoice"} • {viewReceipt?.uploadedAt.toLocaleString() || ""}
            </DialogDescription>
          </DialogHeader>
          {viewReceipt?.fileUrl && (
            <div className="text-sm">
              <a
                href={viewReceipt.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline"
              >
                Open uploaded file
              </a>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewReceipt?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unit}</TableCell>
                    <TableCell className="text-right">₱ {item.unitPrice}</TableCell>
                    <TableCell className="text-right">₱ {item.totalPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
