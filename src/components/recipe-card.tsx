import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, ListChecks, Soup } from 'lucide-react';

interface RecipeCardProps {
  recipe: GenerateRecipeOutput;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="w-full shadow-xl animate-fadeInUp overflow-hidden">
      <CardHeader className="bg-primary/10 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <Soup className="h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold text-primary leading-tight">{recipe.recipeName}</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground italic">
          A delicious recipe generated just for you!
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center text-accent">
            <ListChecks className="mr-2 h-6 w-6" /> Ingredients
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/90">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="leading-relaxed">{ingredient}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center text-accent">
            <Zap className="mr-2 h-6 w-6" /> Instructions
          </h3>
          <div
            className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: recipe.instructions.replace(/\n/g, '<br />') }}
          />
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-6 flex flex-col sm:flex-row justify-around items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Cooking Time:</span>
          <Badge variant="secondary" className="text-sm">{recipe.cookingTime} mins</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Baking Time:</span>
          <Badge variant="secondary" className="text-sm">{recipe.bakingTime > 0 ? `${recipe.bakingTime} mins` : 'N/A'}</Badge>
        </div>
      </CardFooter>
    </Card>
  );
}

// Add a simple fade-in animation to globals.css or tailwind.config.js if you want
// For tailwind.config.js:
// theme: {
//   extend: {
//     animation: {
//       fadeInUp: 'fadeInUp 0.5s ease-out forwards',
//     },
//     keyframes: {
//       fadeInUp: {
//         '0%': { opacity: '0', transform: 'translateY(20px)' },
//         '100%': { opacity: '1', transform: 'translateY(0)' },
//       },
//     },
//   },
// },
