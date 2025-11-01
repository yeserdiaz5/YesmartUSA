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
