// app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from 'resend';
import EmailTemplate from "@/emails";

// Initialize Resend with API key
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    console.log('📧 Send email API called');
    
    // Check if API key exists
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured');
      return NextResponse.json(
        { 
          success: false, 
          message: "Email service not configured",
          debug: "RESEND_API_KEY missing"
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, otp } = body;

    console.log('📧 Sending email to:', email);
    console.log('🔢 OTP:', otp);

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Email and OTP are required" 
        },
        { status: 400 }
      );
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      // IMPORTANT: Use a verified domain or resend's default domain
      from: "support@noreply.stories.fun", // Use Resend's default domain for testing
      // Alternative: from: "noreply@yourdomain.com", // Use your verified domain
      to: [email],
      subject: "Account Verification OTP",
      react: await Promise.resolve(EmailTemplate({ otp: parseInt(otp) })),
    });

    console.log('✅ Resend response:', emailResponse);

    // Check if email was sent successfully
    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email",
          debug: emailResponse.error
        },
        { status: 500 }
      );
    }

    console.log('🎉 Email sent successfully with ID:', emailResponse.data?.id);

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent successfully",
        emailId: emailResponse.data?.id
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("❌ Email sending error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Email sending failed",
        debug: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: "Method not allowed", 
      message: "Use POST to send emails" 
    },
    { status: 405 }
  );
}