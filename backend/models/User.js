class User {
    constructor(id, name, email, password, phone, location, interests, type, achievements) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.location = location;
        this.interests = interests.split(',').map(i => i.trim());
        this.type = type;
        this.achievements = achievements;
    }
}
module.exports = User;