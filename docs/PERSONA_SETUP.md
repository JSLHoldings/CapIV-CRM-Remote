# Persona KYC/AML Integration Setup

This guide will help you set up Persona identity verification for your JSL CRM application.

## Prerequisites

1. A Persona account (sign up at https://withpersona.com)
2. Access to your Persona Dashboard

## Setup Steps

### 1. Create a Persona Account

1. Go to https://withpersona.com and sign up for an account
2. Complete the onboarding process
3. Navigate to your Persona Dashboard

### 2. Create a Verification Template

1. In the Persona Dashboard, go to **Templates**
2. Click **Create Template**
3. Choose **Individual Verification** as the template type
4. Configure the verification steps:
   - **Government ID Verification**: Enable to verify government-issued IDs
   - **Selfie Verification**: Enable for liveness detection
   - **Database Verification**: Optional - enable for additional checks
   - **Document Verification**: Optional - for additional documents
5. Save your template and note the **Template ID**

### 3. Get Your Environment ID

1. In the Persona Dashboard, go to **Settings** → **API Keys**
2. Find your **Environment ID** (also called Publishable Key)
3. Copy this value - you'll need it for configuration

### 4. Configure Environment Variables

1. In your v0 project, go to **Project Settings** (gear icon in top right)
2. Navigate to **Environment Variables**
3. Add the following variables:

\`\`\`
NEXT_PUBLIC_PERSONA_TEMPLATE_ID=itmpl_xxxxxxxxxxxxx
NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID=env_xxxxxxxxxxxxx
\`\`\`

Replace the values with your actual Template ID and Environment ID from Persona.

### 5. Test the Integration

1. Deploy your application or run it locally
2. Create a new user account
3. Complete the NDA signing step
4. You should see the Persona verification flow
5. Complete the verification with a test ID (in sandbox mode)

## Sandbox vs Production

### Sandbox Mode (Development)

- Use sandbox environment credentials for testing
- Test with sample IDs provided by Persona
- No real verification is performed
- Free to use for development

### Production Mode

- Use production environment credentials
- Real identity verification is performed
- Charges apply per verification
- Requires Persona account approval

## Verification Flow

The verification process follows these steps:

1. **NDA Signing**: User signs the non-disclosure agreement
2. **KYC/AML Verification**: User completes Persona identity verification
   - Upload government ID
   - Take a selfie for liveness detection
   - Complete any additional verification steps
3. **Company Information**: User fills out company details
4. **Access Granted**: User can access the CRM application

## Customization

### Styling the Persona Flow

The Persona iframe can be styled using CSS. The component includes default styling with a minimum height of 650px and full width.

### Handling Verification Events

The `PersonaKYC` component handles the following events:

- `onReady`: Called when Persona client is ready
- `onComplete`: Called when verification is successful
- `onCancel`: Called when user cancels verification
- `onError`: Called when an error occurs

### Reference ID

The system automatically uses the user's ID as the reference ID for Persona inquiries, allowing you to link verifications back to specific users.

## Troubleshooting

### Persona SDK Not Loading

- Check your internet connection
- Verify the Persona CDN is accessible
- Check browser console for errors

### Invalid Template ID or Environment ID

- Verify the IDs are correct in your environment variables
- Ensure you're using the correct environment (sandbox vs production)
- Check that the template is published in Persona Dashboard

### Verification Fails

- Ensure the ID document is clear and readable
- Check that the selfie has good lighting
- Verify the user's information matches their ID

## Security Considerations

1. **Environment Variables**: The Persona IDs are public (client-side) but safe to expose
2. **Data Storage**: Verification status is stored locally; inquiry IDs are stored per user
3. **Privacy**: User data is processed by Persona according to their privacy policy
4. **Compliance**: Persona is compliant with GDPR, CCPA, and other regulations

## Support

- Persona Documentation: https://docs.withpersona.com
- Persona Support: support@withpersona.com
- JSL CRM Support: Contact your system administrator

## Pricing

Persona charges per verification. Pricing varies based on:
- Verification type (individual vs business)
- Volume of verifications
- Additional features enabled

Contact Persona sales for detailed pricing information.
