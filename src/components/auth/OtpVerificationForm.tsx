import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ArrowRight } from "lucide-react";

interface OtpVerificationFormProps {
  email: string;
  otp: string;
  setOtp: (otp: string) => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBackToSignIn: () => void;
}

export function OtpVerificationForm({
  email,
  otp,
  setOtp,
  isLoading,
  error,
  onSubmit,
  onBackToSignIn,
}: OtpVerificationFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <CardContent className="pb-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="code" value={otp} />

        <div className="flex justify-center">
          <InputOTP
            className="neu-inset rounded-xl p-2"
            value={otp}
            onChange={setOtp}
            maxLength={6}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                const form = (e.target as HTMLElement).closest("form");
                if (form) {
                  form.requestSubmit();
                }
              }
            }}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500 text-center">
            {error}
          </p>
        )}
        <p className="text-sm text-muted-foreground text-center mt-4">
          Didn't receive a code?{" "}
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={onBackToSignIn}
          >
            Try again
          </Button>
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          type="submit"
          className="w-full neu-raised rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify code
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onBackToSignIn}
          disabled={isLoading}
          className="w-full neu-flat rounded-xl text-emerald-50 hover:bg-emerald-700"
        >
          Use different email
        </Button>
      </CardFooter>
    </form>
  );
}
