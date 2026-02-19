import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

export function AuthHeader() {
  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline" className="text-sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button className="bg-blue-600 hover:bg-blue-700 text-sm">
            Sign Up
          </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
