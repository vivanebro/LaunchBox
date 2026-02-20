import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // --- Security Check ---
        // Retrieve the shared secret from environment variables
        const expectedSecret = Deno.env.get("GHL_WEBHOOK_SECRET");

        if (!expectedSecret) {
            console.error("GHL_WEBHOOK_SECRET is not set in environment variables.");
            return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        // GoHighLevel webhooks might send the secret in a header or query parameter.
        // For this example, we'll assume it's passed as a query parameter named 'secret'.
        // You might need to adjust this based on how Will configures it in GoHighLevel.
        const url = new URL(req.url);
        const providedSecret = url.searchParams.get("secret");

        if (!providedSecret || providedSecret !== expectedSecret) {
            console.warn("Unauthorized webhook access attempt. Provided secret:", providedSecret);
            return Response.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
        }
        // --- End Security Check ---


        const payload = await req.json(); // Assuming GoHighLevel sends JSON payload

        // Log the incoming payload for debugging purposes (remove in production if sensitive)
        console.log('Received GoHighLevel webhook payload:', payload);

        // Extract client data from the payload.
        // These keys (e.g., 'email', 'firstName', 'lastName') are examples.
        // Will needs to ensure GoHighLevel sends data with these exact keys,
        // or you'll need to adjust them to match GoHighLevel's output.
        const clientEmail = payload.email || payload.contact?.email; // Example for nested contact object
        const clientFirstName = payload.firstName || payload.contact?.firstName;
        const clientLastName = payload.lastName || payload.contact?.lastName;
        
        // Construct full name, handling cases where only first or last name might be present
        let clientFullName = '';
        if (clientFirstName && clientLastName) {
            clientFullName = `${clientFirstName} ${clientLastName}`;
        } else if (clientFirstName) {
            clientFullName = clientFirstName;
        } else if (clientLastName) {
            clientFullName = clientLastName;
        }


        if (!clientEmail || !clientFullName) {
            return Response.json({ 
                error: 'Missing client email or full name in payload',
                receivedPayload: payload // Include payload for debugging
            }, { status: 400 });
        }

        // Check if user already exists to avoid duplicates
        const existingUsers = await base44.asServiceRole.entities.User.filter({ email: clientEmail });
        
        if (existingUsers && existingUsers.length > 0) {
            console.log('User already exists:', existingUsers[0]);
            return Response.json({ 
                success: true, 
                userId: existingUsers[0].id, 
                message: 'User already exists',
                userAlreadyExisted: true
            }, { status: 200 });
        }

        // Create the user in your Base44 app using service role for elevated permissions
        // The 'User' entity is built-in.
        const newUser = await base44.asServiceRole.entities.User.create({
            email: clientEmail,
            full_name: clientFullName,
            role: 'user', // Default role for new clients
            // If you have additional custom fields on your User entity (e.g., 'ghl_contact_id'),
            // you can add them here:
            // ghl_contact_id: payload.contactId, 
        });

        console.log('New client created:', newUser);

        return Response.json({ 
            success: true, 
            userId: newUser.id, 
            message: 'User created successfully',
            userAlreadyExisted: false
        }, { status: 200 });

    } catch (error) {
        console.error('Error processing GoHighLevel webhook:', error);
        return Response.json({ error: error.message, details: error.stack }, { status: 500 });
    }
});