Add-Type -AssemblyName PresentationCore
function Read-Bitmap($Path) {
  $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create([uri](Resolve-Path $Path).Path,[System.Windows.Media.Imaging.BitmapCreateOptions]::None,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  return $decoder.Frames[0]
}
function Save-Crop($Source,$Rect,$Scale,$Path) {
  $crop = New-Object System.Windows.Media.Imaging.CroppedBitmap($Source, $Rect)
  $scaled = New-Object System.Windows.Media.Imaging.TransformedBitmap($crop, (New-Object System.Windows.Media.ScaleTransform($Scale,$Scale)))
  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($scaled))
  $stream = [System.IO.File]::Create((Join-Path $PWD $Path))
  $encoder.Save($stream); $stream.Dispose()
}
$out = 'artifacts/building-phase3b/barista/'
Save-Crop (Read-Bitmap 'assets/building/floor-1f-217.webp') (New-Object System.Windows.Int32Rect(1528,644,64,72)) 6 ($out+'iseul-reference-crop.png')
Save-Crop (Read-Bitmap 'assets/building/floor-1f-v2.webp') (New-Object System.Windows.Int32Rect(1432,550,240,254)) 2 ($out+'cafe-reference-crop.png')
