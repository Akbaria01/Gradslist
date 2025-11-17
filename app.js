import { db } from "./src/firebase.js";
import { collection,doc, setDoc, addDoc } from "firebase/firestore";

// if you want to be able to run the code below copy+paste "app": "node app.js" into your 
// package.json file inside scritps{}, and copy+paste "type": "module" and place under the "main": "postcss.config.js"
// inside package.json once done hit save and in teriminal type "npm run app"

// this allows us to set a user with an ID must use "setDoc" and "doc"
// async function addUser() {
//   await setDoc(doc(db, "users", "user1"), {
//     name: "Michael"
//   });
//   console.log("User added!");
// }

// addUser();

// this allows us to add a user without setting userID. must use "addDoc" and "collection"
async function addUser() {
    const docRef = await addDoc(collection(db,"users"),{
        name: "Chandler"
    });

  console.log("User added!");
}

addUser();