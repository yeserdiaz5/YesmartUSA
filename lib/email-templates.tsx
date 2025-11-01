import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "YesMart USA <noreply@yesmartusa.com>",
      to: [to],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error("[v0] Error sending email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return { success: false, error }
  }
}

export function customerShippedTemplate(data: {
  customerName: string
  orderNumber: string
  trackingNumber: string
  trackingUrl: string
  carrier: string
  labelUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Your Order Has Been Shipped!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Great news! Your order #${data.orderNumber} has been shipped and is on its way to you.</p>
            
            <div class="info-box">
              <p><strong>Carrier:</strong> ${data.carrier}</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
              <p><a href="${data.trackingUrl}" class="button">Track Your Package</a></p>
            </div>
            
            <p>You can also download your shipping label here:</p>
            <p><a href="${data.labelUrl}" class="button">Download Shipping Label</a></p>
            
            <p>Thank you for shopping at YesMart USA!</p>
          </div>
          <div class="footer">
            <p>YesMart USA - Your trusted marketplace</p>
            <p>If you have any questions, please contact us at support@yesmartusa.com</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function sellerLabelCreatedTemplate(data: {
  orderNumber: string
  trackingNumber: string
  carrier: string
  labelUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Shipping Label Created</h1>
          </div>
          <div class="content">
            <p>A shipping label has been created for order #${data.orderNumber}.</p>
            
            <div class="info-box">
              <p><strong>Carrier:</strong> ${data.carrier}</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            </div>
            
            <p>Download your shipping label:</p>
            <p><a href="${data.labelUrl}" class="button">Download Label</a></p>
          </div>
          <div class="footer">
            <p>YesMart USA - Seller Portal</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function labelCreatedTemplate(data: {
  customerName: string
  orderNumber: string
  trackingNumber: string
  carrier: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Your Shipping Label is Ready</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Your shipping label has been created for order #${data.orderNumber}.</p>
            
            <div class="info-box">
              <p><strong>Carrier:</strong> ${data.carrier}</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            </div>
            
            <p>Your package will be shipped soon!</p>
          </div>
          <div class="footer">
            <p>YesMart USA - Your trusted marketplace</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function inTransitTemplate(data: {
  customerName: string
  orderNumber: string
  trackingNumber: string
  trackingUrl: string
  carrier: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Your Package is On the Way!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Your order #${data.orderNumber} is now in transit!</p>
            
            <div class="info-box">
              <p><strong>Carrier:</strong> ${data.carrier}</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
              <p><a href="${data.trackingUrl}" class="button">Track Your Package</a></p>
            </div>
          </div>
          <div class="footer">
            <p>YesMart USA - Your trusted marketplace</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function deliveredTemplate(data: {
  customerName: string
  orderNumber: string
  trackingNumber: string
  carrier: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Your Package Has Been Delivered!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>Great news! Your order #${data.orderNumber} has been delivered.</p>
            
            <div class="info-box">
              <p><strong>Carrier:</strong> ${data.carrier}</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            </div>
            
            <p>We hope you enjoy your purchase! Thank you for shopping at YesMart USA.</p>
          </div>
          <div class="footer">
            <p>YesMart USA - Your trusted marketplace</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function shippingFailedTemplate(data: {
  customerName: string
  orderNumber: string
  trackingNumber: string
  carrier: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Shipping Issue with Your Order</h1>
          </div>
          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>We're sorry, but there's been an issue with the delivery of your order #${data.orderNumber}.</p>
            
            <div class="info-box">
              <p><strong>Carrier:</strong> ${data.carrier}</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            </div>
            
            <p>Please contact us at support@yesmartusa.com for assistance.</p>
          </div>
          <div class="footer">
            <p>YesMart USA - Your trusted marketplace</p>
          </div>
        </div>
      </body>
    </html>
  `
}
