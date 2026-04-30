// Get the functions in the db.js file to use
const db = require('../db');

class Student {
    // Student ID
    id;
    // Student name
    name;
    // Student programme
    programme;
    // Student modules
    modules = [];

    constructor(id) {
        this.id = id;
    }
    
    async getStudentName() {
         if (typeof this.name !== 'string') {
            var sql = "SELECT * from Students where id = ?"
            const results = await db.query(sql, [this.id]);
            this.name = results[0].name;
        }
        
    }
    
    async getStudentProgramme()  {
    }
    
    async getStudentModules() {
    }
}

module.exports = {
    Student
}