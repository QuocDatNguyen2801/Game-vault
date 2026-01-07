const { Schema, model } = require('mongoose');

const postSchema = new Schema({
    _id: { type: String, required: true },
    id: { type: String }, 
    title: { type: String, required: true },
    image: { type: String },
    content: { type: String, required: true },
    authorID: { type: String }, 
    authorId: { type: String },
    userID: { type: String },
    userId: { type: String },
    authorName: { type: String, required: true },
    likedBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    readMins: { type: Number },
    likes: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false }
}, { timestamps: true });

postSchema.pre('validate', function() {
    if (!this.id) this.id = this._id;
    if (!this.authorID) this.authorID = this.authorId;
    if (!this.userID) this.userID = this.userId;
});

postSchema.path('authorID').required(true, 'authorID is required');
postSchema.path('userID').required(true, 'userID is required');

module.exports = model('Post', postSchema);