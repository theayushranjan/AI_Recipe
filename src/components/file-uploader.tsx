"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
  onImageUploaded: (dataUri: string) => void;
  isLoading: boolean;
}

export function FileUploader({ onImageUploaded, isLoading }: FileUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setImagePreview(null);
    setUploadProgress(0);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxFileSize) {
        setError(`File is too large. Max size is ${maxFileSize / (1024*1024)}MB.`);
        toast({
          title: "Upload Error",
          description: `File is too large. Max size is ${maxFileSize / (1024*1024)}MB.`,
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please upload an image.');
         toast({
          title: "Upload Error",
          description: 'Invalid file type. Please upload an image.',
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        onImageUploaded(reader.result as string);
        setUploadProgress(100);
         toast({
          title: "Image Selected",
          description: "Image ready for analysis.",
          action: <CheckCircle className="text-green-500" />,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setImagePreview(null);
    setUploadProgress(0);

    if (!imageUrl) {
      setError('Please enter an image URL.');
      return;
    }

    try {
      // Basic URL validation (more robust validation might be needed)
      new URL(imageUrl);
    } catch (_) {
      setError('Invalid URL format.');
      toast({
        title: "URL Error",
        description: "Invalid URL format.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate progress for URL fetching
    setUploadProgress(25);

    try {
      const response = await fetch(imageUrl);
      setUploadProgress(50);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('URL does not point to a valid image type.');
      }
      
      const blob = await response.blob();
      if (blob.size > maxFileSize) {
         throw new Error(`Fetched image is too large. Max size is ${maxFileSize / (1024*1024)}MB.`);
      }
      setUploadProgress(75);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        onImageUploaded(reader.result as string);
        setUploadProgress(100);
        toast({
          title: "Image Loaded",
          description: "Image from URL ready for analysis.",
          action: <CheckCircle className="text-green-500" />,
        });
      };
      reader.onerror = () => {
        throw new Error('Failed to read image from URL.');
      }
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setError(err.message || 'Failed to load image from URL.');
      toast({
        title: "URL Error",
        description: err.message || 'Failed to load image from URL.',
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };
  
  useEffect(() => {
    // Reset preview if isLoading changes (e.g. new analysis started)
    if (isLoading) {
      // This might be too aggressive, consider if a new image is uploaded while still loading.
      // For now, it's a simple reset.
    }
  }, [isLoading]);


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Upload Your Ingredients Image</CardTitle>
        <CardDescription>Add an image of your ingredients to get started. Supports JPG, PNG, WEBP. Max 5MB.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="file" disabled={isLoading}><UploadCloud className="mr-2 h-4 w-4" />From Device</TabsTrigger>
            <TabsTrigger value="url" disabled={isLoading}><LinkIcon className="mr-2 h-4 w-4" />From URL</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <div className="space-y-4">
              <Label htmlFor="file-upload" className="text-sm font-medium text-foreground">
                Choose an image file
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="file:text-primary file:font-semibold hover:file:bg-primary/10"
                disabled={isLoading}
              />
            </div>
          </TabsContent>
          <TabsContent value="url">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <Label htmlFor="image-url" className="text-sm font-medium text-foreground">
                  Image URL
                </Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                Load Image from URL
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {uploadProgress > 0 && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full [&>div]:bg-primary" />
            <p className="text-sm text-muted-foreground mt-1 text-center">{uploadProgress === 100 ? "Ready!" : `Loading... ${uploadProgress}%`}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            {error}
          </div>
        )}

        {imagePreview && (
          <div className="mt-6 border border-border rounded-lg p-4 shadow-inner bg-muted/30">
            <h3 className="text-lg font-medium mb-2 text-center text-primary">Image Preview</h3>
            <div className="relative w-full aspect-video rounded-md overflow-hidden">
              <Image
                src={imagePreview}
                alt="Ingredients preview"
                layout="fill"
                objectFit="contain"
                data-ai-hint="food ingredients"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
