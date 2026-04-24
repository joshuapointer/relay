import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#003B73',
            colorSuccess: '#2ECC71',
          },
        }}
      />
    </div>
  );
}
