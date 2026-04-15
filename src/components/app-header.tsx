import Link from 'next/link';
import { RecipeSnapLogo } from '@/components/recipe-snap-logo';
import { ChefHat } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2" aria-label="Recipe Snap Home">
          <RecipeSnapLogo className="h-8 w-auto" />
        </Link>
        <div className="flex items-center space-x-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="font-semibold text-primary hidden sm:inline">AI Powered Recipes</span>
        </div>
      </div>
    </header>
  );
}
