const admin = require("firebase-admin");

let initialized = false;

function initFirebase() {
    if (initialized) return;

    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    initialized = true;
}

initFirebase();

const db = admin.firestore();

module.exports = {
    db,
    admin
};
