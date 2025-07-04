import { NextResponse } from "next/server";
import { resend } from "@/helpers/resend";
import * as React from "react";
import EmailTemplate from "@/emails";

export const SendEmail = async (email: string, otp: number) => {
  //Send Email Functionality
  try {
    await resend.emails.send({
      from: "iyer.adhitya@gmail.com",
      to: [email],
      subject: "Account Verification OTP",
      react: EmailTemplate({ otp: otp }) as React.ReactElement,
    });
    return NextResponse.json(
      {
        success: true,
        message: "verification email sent successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Email sending error" },
      { status: 500 }
    );
  }
};