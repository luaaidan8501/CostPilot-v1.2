"use client"

import type React from "react"
import { useState, useRef } from "react"
import { usePurchases } from "@/lib/hooks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraIcon, PlusIcon } from "@/components/icons"

export default function PurchasesPage() {
  const [purchaseType, setPurchaseType] = useState<"invoice" | "camera" | "quick" | "manual">("invoice")
  const [cameraActive, setCameraActive] = useState(false)
  const [photoCapture, setPhotoCapture] = useState<string | null>(null)
  const [currentDate] = useState(new Date())
  const { data: purchases } = usePurchases()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [quickAddForm, setQuickAddForm] = useState({
    ingredient: "",
    quantity: "",
    unit: "",
    totalPrice: "",
    supplier: "",
    type: "Regular",
  })

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle quick add submission
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
        <p className="text-slate-600 mt-1">Upload this week's receipts all at once or add items manually</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add Purchase Data</CardTitle>
            <CardDescription>Choose how you want to log your purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={purchaseType} onValueChange={(v) => setPurchaseType(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="invoice">Weekly Upload</TabsTrigger>
                <TabsTrigger value="camera">Camera Scan</TabsTrigger>
                <TabsTrigger value="quick">Quick Add</TabsTrigger>
                <TabsTrigger value="manual">No Receipt?</TabsTrigger>
              </TabsList>

              <TabsContent value="invoice" className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <input type="file" accept="image/*,application/pdf" multiple className="hidden" id="invoice-upload" />
                  <label htmlFor="invoice-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="text-4xl">📄</div>
                      <p className="text-lg font-medium">Upload This Week's Receipts</p>
                      <p className="text-sm text-slate-500">Drop multiple images or PDFs here, or click to select</p>
                      <p className="text-xs text-slate-400">We'll organize them by date for you</p>
                    </div>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Which week are these receipts from?</Label>
                  <Select defaultValue="this-week">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-week">This week (Nov 18-24)</SelectItem>
                      <SelectItem value="last-week">Last week (Nov 11-17)</SelectItem>
                      <SelectItem value="two-weeks">2 weeks ago (Nov 4-10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  💡 <span className="font-medium">Tip:</span> Upload all your weekly receipts at once. Our system will
                  parse the items and dates automatically.
                </div>
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
                          <Label htmlFor="quick-ingredient">Ingredient</Label>
                          <Input
                            id="quick-ingredient"
                            placeholder="Select ingredient"
                            value={quickAddForm.ingredient}
                            onChange={(e) => setQuickAddForm({ ...quickAddForm, ingredient: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quick-quantity">Quantity</Label>
                          <Input
                            id="quick-quantity"
                            type="number"
                            placeholder="e.g., 5"
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
                              <SelectValue placeholder="Select unit" />
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
                          <Label htmlFor="quick-price">Total Price (₱)</Label>
                          <Input
                            id="quick-price"
                            type="number"
                            placeholder="e.g., 500"
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
                        <div className="space-y-2">
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
                      <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Purchase
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                  📝 <span className="font-medium">No receipt?</span> Enter your best estimate. You can update it later
                  when you find the receipt.
                </div>
                <form onSubmit={handleQuickAdd} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-ingredient">Ingredient</Label>
                      <Input
                        id="manual-ingredient"
                        placeholder="e.g., Chicken"
                        value={quickAddForm.ingredient}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, ingredient: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-supplier">Supplier</Label>
                      <Input
                        id="manual-supplier"
                        placeholder="e.g., Golden Poultry"
                        value={quickAddForm.supplier}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, supplier: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-quantity">Quantity</Label>
                      <Input
                        id="manual-quantity"
                        type="number"
                        placeholder="5"
                        value={quickAddForm.quantity}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-unit">Unit</Label>
                      <Select
                        value={quickAddForm.unit}
                        onValueChange={(v) => setQuickAddForm({ ...quickAddForm, unit: v })}
                      >
                        <SelectTrigger id="manual-unit">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-price">Total Price (₱)</Label>
                      <Input
                        id="manual-price"
                        type="number"
                        placeholder="900"
                        value={quickAddForm.totalPrice}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, totalPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="estimated" className="rounded" />
                    <Label htmlFor="estimated" className="text-sm text-slate-600">
                      Mark as estimated (you can verify later)
                    </Label>
                  </div>
                  <Button type="submit" className="w-full">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Purchase
                  </Button>
                </form>
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

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
