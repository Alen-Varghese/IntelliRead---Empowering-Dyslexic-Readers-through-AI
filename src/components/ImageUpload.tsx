import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeFunction } from "@/lib/api";

interface ImageUploadProps {
  onTextExtracted: (text: string) => void;
}

export function ImageUpload({ onTextExtracted }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Call OCR edge function
      let { data, error } = await invokeFunction('ocr-extract', {
        body: { image: base64 }
      });

      // If the server OCR is unavailable (e.g. no Gemini key on the hosted site), read the image in the browser.
      if (error || !data) {
        console.warn('Server OCR unavailable, using Tesseract.js in the browser:', error);
        const Tesseract = (await import('tesseract.js')).default;
        const result = await Tesseract.recognize(base64, 'eng');
        data = { text: result.data.text, engine: 'tesseract' };
        error = null;
      }

      if (data.text && data.text.trim().length > 0) {
        onTextExtracted(data.text.trim());
        toast({
          title: "Text extracted!",
          description: `Extracted ${data.text.split(/\s+/).length} words from the image`,
        });
      } else {
        toast({
          title: "No text found",
          description: "Could not extract text from this image. Try a clearer image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Upload failed",
        description: "Could not process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isProcessing}
          className="relative"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Handwriting Image
            </>
          )}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {preview && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={preview}
            alt="Uploaded handwriting"
            className="w-full h-auto max-h-48 object-contain bg-muted"
          />
        </div>
      )}
    </div>
  );
}
