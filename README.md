# Water-Pollution-Project-494

Backend

    #Required NPM
        npm i nodemon morgan -D
        npm i multer
        npm install --save express-validator
        npm i express-async-errors
        npm install bcrypt
        npm install firebase
        npm install firebase-admin
        npm install jsonwebtoken
        npm install multer firebase-admin
        npm install openai
        npm install country-list
        npm install express openai
        npm install streamifier
        npm install xlsx
        npm install express multer convert-excel-to-json
        npm install nodemailer
        npm install sib-api-v3-sdk
        npm install dialogflow openai
        npm install @google-cloud/dialogflow
        npm install --save-dev jest supertest
        npm install --save-dev jest-mock-extended


Frontend
    
    npm install @react-native-firebase/auth

Postman Requests

    #For starting backend 
        npm start

    #For starting backend in dev options use
        npm run dev

    #Controllers
    http://localhost:4848

        /api/chatbot
        
            // Endpoint to get response from the fine-tuned model
            post /ask-lake-info

            {
            "prompt": "What do you know about van lake's water quality result"
            }


            // Admin route to manually fine-tune the model with user "posts"
            post /admin/fine-tune

        /api/user

            //POST Register
            /register   

            //POST Login
            /login  

            //DELETE Own Account
            /delete 

            // Admin route to delete a user by email
            delete /admin/delete/:email

            // Endpoint to get notifications
            get /notifications/:sortOrder 

            //PUT mark as read for specific notif.
            /notifications/:id/read 

            //PUT mark as read for all notif.
            /notifications/read-all 

            //PUT update password
            /update/password 
            {
                "newPassword": "password1234"
            }

            // Route to request a password reset
            post /password-reset

            //PUT update user info
            /update/info    

            //GET all users' info.
            /all 

            //POST upload user pic.
            /uploadProfilePicture 

            //GET chech if there is a unread notif
            /hasUnread 

            // GET user info
            /info 

            // Route to delete a notification by its notifId
            delete /notifications/:notifId

            // Route to delete all notifications for the current user
            delete /deleteAllnotifications

        /api/post

            // Create a post
            post /create

            // Get all approved posts by current user order desc or asc
            get /approvedByUser/:sortOrder

            // Get all approved posts
            get /approved/:sortOrder

            // Get all posts for current user
            get /allPostsByCurrentUser/:sortOrder

            // Get all posts sorted by createdAt
            get /allposts/:sortOrder

            // Get all approved posts for a specific location by locationId sorted by createdAt
            get /location/:locationId/:sortOrder

            // Route to delete a post by postId
            delete /:postId
            {
                "message": "Inappropriate content!"
            }

            // Admin approves a specific post
            put /approve/:postId

            // Admin gets all unapproved posts sorted by createdAt
            get /unapproved/:sortOrder

            // Route to update post
            put /update/:postId

            // Route to get posts grouped by location for the current user, sorted by createdAt
            get /grouped/:sortOrder

            // Route to unapprove and delete a post and send notif by admin
            delete /unapprove/:postId

        /api/locations

            // Admins can create a location
            post /create

            // Delete a location
            delete /:id

            // Get all locations
            get /

            // Route to get location by locationId
            get /:locationId

            // Route to calculate and update the rate of a location
            post /calculateRate/:locationId

            // Route to get posts for a specific locationId
            get /locationInfo/:locationId

            // Approve an event by eventId
            // req.body.comment "comment" json da gelecek
            post /approve/:eventId

            // Approve events and delete expired ones
            get /approved-events
        
             // Get all unapproved events
            get /unapproved-events

            //Reject Event also delete it
            post /reject-event

POSTMAN REQUESTS

    #User Registration
    
        Request: POST /api/user/register
        Body:
            {
                "name": "John",
                "surname": "Doe",
                "email": "john.doe223@example.com",
                "password": "password123",
                "country": "TR"
            }
    
    #User Login
    
        Request: POST /api/user/login
        Body:
            {
              "email": "john.doe@example.com",
              "password": "password123"
            }
        Body:
            {
              "email": "admin@example.com",
              "password": "password123"
            }
    
    #Create a Post
    
        Request: POST /api/post/create
        Headers:
            "title": "My First Post"
            "comment": "This is the content of my first post."
            "locationId": location.id
            "photos": FILE // Add at least one "photos" and at most three. While adding a photos write "photos" as a key for each one 
            "photos": FILE
            "cleanliness": 3 // Int variable
            "appearance": 0 // Int variable
            "wildlife": 4 // Int variable
    
    #Create a Location
    
        Request: POST /api/locations/create
        Headers:
            "name": "Beach Park",
            "coordinate": "39.9334 32.8597"
            "thumbnail": FILE
            
    #Get User Notifications
    
        Request: GET /api/user/notifications/desc
            
    #Mark as read for a specific notification
    
        Request: PUT /api/user/notifications/:id/read
            
    #Mark as read for all notification 
    
        Request: PUT /api/user/notifications/read-all

    #Create User Profile Picture

        Request: POST /api/user/uploadProfilePicture
    
    #Get Read Status For Notification 

        Request: GET /api/user/hasUnread




FRONTEND

../../IpAddress.js; -> You can change IP address from this file.
