import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0'; // Added specific version for uuid

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // --- Security Check ---
        // This function will be called by GoHighLevel.
        // We need a shared secret to ensure only authorized GoHighLevel accounts can request codes.
        const expectedSecret = Deno.env.get("GHL_WEBHOOK_SECRET");

        if (!expectedSecret) {
            console.error("GHL_WEBHOOK_SECRET is not set in environment variables.");
            return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        const url = new URL(req.url);
        const providedSecret = url.searchParams.get("secret");

        if (!providedSecret || providedSecret !== expectedSecret) {
            console.warn("Unauthorized code request attempt. Provided secret:", providedSecret);
            return Response.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
        }
        // --- End Security Check ---

        // Generate a unique code
        // Ensure the code meets the pattern/length requirements of the AccessCode entity
        let newCode;
        let isUnique = false;
        while (!isUnique) {
            newCode = uuidv4().replace(/-/g, '').substring(0, 15).toUpperCase(); // Example: 15-char alphanumeric
            const existingCodes = await base44.asServiceRole.entities.AccessCode.filter({ code: newCode });
            if (existingCodes.length === 0) {
                isUnique = true;
            }
        }

        // Store the new unique code in the AccessCode entity
        const createdAccessCode = await base44.asServiceRole.entities.AccessCode.create({
            code: newCode,
            status: 'unused',
            generation_source: 'GoHighLevel-Request'
        });

        console.log('Generated and stored new access code:', createdAccessCode.code);

        // Return the newly generated code to GoHighLevel
        return Response.json({ success: true, access_code: newCode }, { status: 200 });

    } catch (error) {
        console.error('Error generating access code:', error);
        return Response.json({ error: error.message, details: error.stack }, { status: 500 });
    }
});