const express = require('express');
const stripUtils = require("./utils/stripe");
const index = express();
const admin = require('firebase-admin');
const serviceAccount = require('./services-account');


let server;


server = index.listen(process.env.PORT || 5000, () => console.log(`Running on port ${process.env.PORT || 5000}`));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();



//
const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
        process.exit(1);
    });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
if (server) {
    server.close();
}
});



const updateUserSubscriptionByUserId=async (id,subscription_id,status)=>{
    if(id) await db.collection('Subscriber').doc(id).update({subscription_id,status});
}



const updateSubscriptionBySubscriptionId=async (subscription_id,status)=>{
    const find=await db.collection('Subscriber').where("subscription_id", "==",subscription_id).get();
    let user;
    find.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        user=doc.data();
        return
    });

    if(user && user.id) await db.collection('Subscriber').doc(user.id).update({subscription_id,status});
}


const deleteSubscriptionBySubscriptionId=async (subscription_id)=>{

    const find=await db.collection('Subscriber').where("subscription_id", "==",subscription_id).get();
    let user;
    find.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        user=doc.data();
        return
    });
    if(user && user.id) await db.collection('Subscriber').doc(user.id).update({subscription_id:null,status:"deleted"});
}






// Match the raw body to content type application/json
// If you are using Express v4 - v4.16 you need to use body-parser, not express, to retrieve the request body
index.post('/webhook', express.json({type: 'application/json'}),  (request, response) => {
    const event = request.body;

console.log("event received = ", event.type);
// Handle the event
switch (event.type) {
    case 'payment_intent.succeeded':
        break;
    case 'payment_method.attached':
        const paymentMethod = event.data.object;
        break;
    case 'customer.subscription.created':
        const subscriptionCreated = event.data.object;
        const {user_id}=subscriptionCreated.metadata;
        updateUserSubscriptionByUserId(user_id,subscriptionCreated.id, subscriptionCreated.status)
        break;
    case 'customer.subscription.trial_will_end':
        break;
    case 'customer.subscription.updated':
        const updateSubscription = event.data.object;
        updateSubscriptionBySubscriptionId(updateSubscription.id, updateSubscription.status);
        break;
    case 'customer.subscription.deleted':
        const deleteSubscription = event.data.object;
        deleteSubscriptionBySubscriptionId(deleteSubscription.id);
        break;
    case 'invoice.payment_failed':
        const invoiceFailed = event.data.object;
        updateSubscriptionBySubscriptionId(invoiceFailed.subscription, "post-due");
        break;
    case 'invoice.paid':
        const invoicePaid = event.data.object;
        updateSubscriptionBySubscriptionId(invoicePaid.subscription, "active");
        break;
    default:
        console.log(`Unhandled event type ${event.type}`);
}

response.json({received: true});
});

index.get('/', (req, res) => {
    res.json({success: true, msg: "server is running"})
})

