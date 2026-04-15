"use client";

import { useState, useEffect } from 'react';
import type { IdentifyIngredientsOutput } from '@/ai/flows/identify-ingredients';
import type { GenerateRecipeInput, GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { identifyIngredients } from '@/ai/flows/identify-ingredients';
import { generateRecipe } from '@/ai/flows/generate-recipe';

import { FileUploader } from '@/components/file-uploader';
import { RecipeCard } from '@/components/recipe-card';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, ChefHat, Clock, CookingPot, Info, List, Wand2, Image as ImageIcon } from 'lucide-react';

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const recipeFormSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.string().min(1, "Quantity is required"), // Using string for input, convert to number later
  })).min(1, "At least one ingredient is required"),
  cookingTime: z.coerce.number().min(0).optional(),
  bakingTime: z.coerce.number().min(0).optional(),
});

type RecipeFormData = z.infer<typeof recipeFormSchema>;

export default function HomePage() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [identifiedIngredientsResult, setIdentifiedIngredientsResult] = useState<IdentifyIngredientsOutput | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<GenerateRecipeOutput | null>(null);
  
  const [isLoadingIdentify, setIsLoadingIdentify] = useState(false);
  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const { control, handleSubmit, reset, setValue, formState: { errors: formErrors } } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      ingredients: [],
      cookingTime: 30,
      bakingTime: 0,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  });

  useEffect(() => {
    if (identifiedIngredientsResult?.ingredients) {
      const initialIngredients = identifiedIngredientsResult.ingredients.map(name => ({ name, quantity: "1 portion" }));
      reset({ ingredients: initialIngredients, cookingTime: 30, bakingTime: 0 });
    }
  }, [identifiedIngredientsResult, reset]);


  const handleImageUploaded = (dataUri: string) => {
    setImageDataUri(dataUri);
    setIdentifiedIngredientsResult(null);
    setGeneratedRecipe(null);
    setError(null);
    reset({ ingredients: [], cookingTime: 30, bakingTime: 0 }); // Reset form when new image is uploaded
  };

  const handleIdentifyIngredients = async () => {
    if (!imageDataUri) {
      setError('Please upload an image first.');
      toast({ title: "Error", description: "Please upload an image first.", variant: "destructive" });
      return;
    }
    setIsLoadingIdentify(true);
    setError(null);
    setIdentifiedIngredientsResult(null); // Clear previous results
    setGeneratedRecipe(null);

    try {
      const result = await identifyIngredients({ photoDataUri: imageDataUri });
      setIdentifiedIngredientsResult(result);
      if (result.ingredients.length === 0) {
        toast({ title: "No Ingredients Found", description: "Could not identify any ingredients in the image.", variant: "default" });
      } else {
        toast({ title: "Ingredients Identified!", description: `${result.ingredients.length} ingredients found.`, variant: "default" });
      }
    } catch (e: any) {
      console.error("Error identifying ingredients:", e);
      const errorMessage = e.message || 'Failed to identify ingredients. Please try another image or check the console.';
      setError(errorMessage);
      toast({ title: "Identification Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingIdentify(false);
    }
  };

  const onSubmitRecipeForm = async (data: RecipeFormData) => {
    if (!identifiedIngredientsResult) {
      setError('Please identify ingredients first.');
      toast({ title: "Error", description: "Please identify ingredients first.", variant: "destructive" });
      return;
    }

    setIsLoadingGenerate(true);
    setError(null);
    setGeneratedRecipe(null);

    const recipeInput: GenerateRecipeInput = {
      ingredients: data.ingredients.map(ing => ing.name),
      quantity: data.ingredients.reduce((acc, ing) => {
        // Attempt to parse quantity, default to 1 if not a number
        const qtyNum = parseFloat(ing.quantity);
        acc[ing.name] = isNaN(qtyNum) ? 1 : qtyNum; // Or handle as string if AI expects string quantities
        return acc;
      }, {} as Record<string, number>), // Assuming quantity is numeric for AI for now
      cookingTime: data.cookingTime,
      bakingTime: data.bakingTime,
    };
    
    // The AI schema expects quantity as Record<string, number>, but form input is string.
    // For simplicity, we'll send string quantities as part of the ingredient name if needed, or adjust AI.
    // For now, we'll try to make it work with the current AI flow structure, sending numeric quantities where possible.
    // A better approach might be to adjust the AI flow to handle string quantities or refine parsing.
    // Let's assume the `generateRecipe` AI can handle quantity as string description or parses it.
    // The current `GenerateRecipeInput` expects `quantity: z.record(z.number())`. So we must send numbers.
    // If the user types "1 cup", we might need another AI step to parse "1 cup" into a numeric representation or a structured quantity.
    // For now, we'll just use the string as is, which might not match the schema expectation perfectly for the quantity field if it's non-numeric.
    // To adhere to the schema:
    const numericQuantities: Record<string, number> = {};
    const descriptiveIngredients: string[] = [];

    data.ingredients.forEach(ing => {
        const num = parseFloat(ing.quantity);
        if (!isNaN(num)) {
            numericQuantities[ing.name] = num;
            descriptiveIngredients.push(`${ing.name} (${ing.quantity})`); // Keep descriptive for recipe text
        } else {
            // If quantity is not purely numeric, we might need to include it in the ingredient name for the AI,
            // or treat its numeric part as 0 or 1. For now, let's pass it as part of the ingredient description.
            numericQuantities[ing.name] = 1; // Default to 1 if not parseable
            descriptiveIngredients.push(`${ing.name} (${ing.quantity})`);
        }
    });
    
    recipeInput.ingredients = descriptiveIngredients; // Send ingredient names with quantities in parens
    recipeInput.quantity = numericQuantities; // Send parsed numbers


    try {
      const result = await generateRecipe(recipeInput);
      setGeneratedRecipe(result);
      toast({ title: "Recipe Generated!", description: `Enjoy your ${result.recipeName}!`, variant: "default" });
    } catch (e: any) {
      console.error("Error generating recipe:", e);
      const errorMessage = e.message || 'Failed to generate recipe. Please try again or adjust inputs.';
      setError(errorMessage);
      toast({ title: "Recipe Generation Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingGenerate(false);
    }
  };
  
  const sectionSpacing = "mb-12";

  return (
    <div className="space-y-8 py-8">
      <section className={`text-center ${sectionSpacing}`}>
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">Welcome to RecipeSnap!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Snap a picture of your ingredients, and let our AI chef whip up a delicious recipe for you.
        </p>
      </section>

      <section className={sectionSpacing}>
        <FileUploader onImageUploaded={handleImageUploaded} isLoading={isLoadingIdentify || isLoadingGenerate} />
      </section>

      {imageDataUri && (
        <section className={`text-center ${sectionSpacing}`}>
          <Button 
            onClick={handleIdentifyIngredients} 
            disabled={isLoadingIdentify || !imageDataUri}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105"
          >
            {isLoadingIdentify ? (
              <Loader size="sm" text="Analyzing..." />
            ) : (
              <>
                <Wand2 className="mr-2 h-6 w-6" /> Analyze Ingredients
              </>
            )}
          </Button>
        </section>
      )}

      {isLoadingIdentify && (
        <div className="flex justify-center my-8">
           <Loader text="Identifying ingredients..." />
        </div>
      )}
      
      {error && !isLoadingIdentify && !isLoadingGenerate && (
         <Alert variant="destructive" className="my-8">
          <Info className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {identifiedIngredientsResult && !isLoadingIdentify && (
        <section className={`grid md:grid-cols-2 gap-8 ${sectionSpacing}`}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-primary"><List className="mr-2 h-6 w-6" /> Identified Ingredients</CardTitle>
              <CardDescription>Review the ingredients found in your image. Adjust quantities and cooking preferences below.</CardDescription>
            </CardHeader>
            <CardContent>
              {identifiedIngredientsResult.ingredients.length > 0 ? (
                <ScrollArea className="h-48">
                  <ul className="space-y-2">
                    {identifiedIngredientsResult.ingredients.map((ingredient, index) => (
                      <li key={index} className="p-2 bg-muted/50 rounded-md text-sm text-foreground flex items-center">
                        <ChefHat className="mr-2 h-4 w-4 text-accent" /> {ingredient}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-4">No specific ingredients identified. You can still manually add them below or try another image.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-primary"><Lightbulb className="mr-2 h-6 w-6" /> Suggested Recipes</CardTitle>
              <CardDescription>Based on the identified items, here are some initial ideas:</CardDescription>
            </CardHeader>
            <CardContent>
               {identifiedIngredientsResult.suggestedRecipes.length > 0 ? (
                <ScrollArea className="h-48">
                  <ul className="space-y-2">
                    {identifiedIngredientsResult.suggestedRecipes.map((suggestion, index) => (
                      <li key={index} className="p-2 bg-muted/50 rounded-md text-sm text-foreground flex items-center">
                        <CookingPot className="mr-2 h-4 w-4 text-accent" /> {suggestion}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-4">No specific recipe suggestions at this time. Define your ingredients to generate one!</p>
              )}
            </CardContent>
          </Card>
        </section>
      )}
      
      {identifiedIngredientsResult && !isLoadingIdentify && (
        <section className={sectionSpacing}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">Customize Your Recipe</CardTitle>
              <CardDescription>Adjust ingredient quantities and set your preferred cooking/baking times.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitRecipeForm)} className="space-y-6">
                <div>
                  <Label className="text-lg font-medium mb-2 block text-accent">Ingredients & Quantities</Label>
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 mb-2 p-3 bg-background rounded-md border">
                      <Controller
                        name={`ingredients.${index}.name`}
                        control={control}
                        render={({ field }) => <Input {...field} readOnly className="font-semibold bg-muted/30 border-0" />}
                      />
                      <Controller
                        name={`ingredients.${index}.quantity`}
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="e.g., 1 cup, 200g, 1 whole" />}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                        <ImageIcon className="h-4 w-4" /> {/* Placeholder for a 'remove' icon, using Image as generic */}
                      </Button>
                    </div>
                  ))}
                   {formErrors.ingredients && <p className="text-sm text-destructive mt-1">{formErrors.ingredients.message || formErrors.ingredients.root?.message}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="cookingTime" className="text-lg font-medium text-accent flex items-center mb-1">
                      <Clock className="mr-2 h-5 w-5" /> Cooking Time (minutes)
                    </Label>
                    <Controller
                      name="cookingTime"
                      control={control}
                      render={({ field }) => <Input id="cookingTime" type="number" {...field} />}
                    />
                    {formErrors.cookingTime && <p className="text-sm text-destructive mt-1">{formErrors.cookingTime.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="bakingTime" className="text-lg font-medium text-accent flex items-center mb-1">
                      <Clock className="mr-2 h-5 w-5" /> Baking Time (minutes)
                    </Label>
                    <Controller
                      name="bakingTime"
                      control={control}
                      render={({ field }) => <Input id="bakingTime" type="number" {...field} />}
                    />
                    {formErrors.bakingTime && <p className="text-sm text-destructive mt-1">{formErrors.bakingTime.message}</p>}
                  </div>
                </div>
                <Button type="submit" disabled={isLoadingGenerate} size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105">
                  {isLoadingGenerate ? <Loader size="sm" text="Whipping up recipe..." /> : <><ChefHat className="mr-2 h-6 w-6" /> Generate Recipe</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {isLoadingGenerate && (
         <div className="flex justify-center my-8">
           <Loader text="Generating your custom recipe..." />
        </div>
      )}

      {generatedRecipe && !isLoadingGenerate && (
        <section className={sectionSpacing}>
          <RecipeCard recipe={generatedRecipe} />
        </section>
      )}
      
      {!imageDataUri && !isLoadingIdentify && !isLoadingGenerate && (
        <Alert className="mt-12 bg-secondary/50 border-secondary">
          <ImageIcon className="h-5 w-5 text-secondary-foreground" />
          <AlertTitle className="text-secondary-foreground font-semibold">Get Started!</AlertTitle>
          <AlertDescription className="text-secondary-foreground/80">
            Upload an image of your ingredients to begin your culinary adventure.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
