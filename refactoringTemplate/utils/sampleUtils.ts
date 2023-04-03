// if you need to import some variable/function from any page,
// try to create a utils function and import this function from any pages/files that import this

// Page1Main.ts
// import {sth} from "./Page2Main"
// PREVENT THIS!!!

// Page1Main.ts
// import {sth} from "./utils/sampleUtils"
//
// Page2Main.ts
// import {sth} from "./utils/sampleUtils"
// DO THIS!!!
