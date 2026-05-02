const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- USER MODEL ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: props => `'${props.value}' is not a valid email address`
        }
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    role: { type: String, enum: ['head_admin', 'admin', 'student'], default: 'student' },
    isApproved: { type: Boolean, default: false }
}, { timestamps: true, autoIndex: true });

UserSchema.index({ email: 1 });

UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- STUDENT PROFILE MODEL ---
const StudentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    paymentHistory: [
        {
            date: { type: Date, required: true },
            month: { type: String, required: true },
            year: { type: Number, required: true },
            amount: { type: Number },
            remarks: { type: String }
        }
    ],
    address: { type: String },
    schoolName: { type: String }
}, { timestamps: true });

const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);

// --- ADMIN PROFILE MODEL ---
const AdminProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    paymentHistory: [
        {
            date: { type: Date, required: true },
            month: { type: String, required: true },
            amount: { type: Number },
            remarks: { type: String }
        }
    ],
    joiningDate: { type: Date, default: Date.now },
    isHidden: { type: Boolean, default: false }
}, { timestamps: true });

const AdminProfile = mongoose.models.AdminProfile || mongoose.model('AdminProfile', AdminProfileSchema);

// --- HOMEWORK MODEL ---
const HomeworkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String },
    targetClasses: { type: [String], required: true },
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const Homework = mongoose.models.Homework || mongoose.model('Homework', HomeworkSchema);

// --- ANNOUNCEMENT MODEL ---
const AnnouncementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetType: { 
        type: String, 
        enum: ['All', 'Class', 'Student'], 
        default: 'All' 
    },
    targetClasses: { type: [String], default: [] },
    targetStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

// --- SCHEDULE MODEL ---
const ScheduleSchema = new mongoose.Schema({
    class: { type: String, required: true },
    subjects: { type: [String], required: true },
    subject: { type: String },
    day: { type: String, required: true },
    time: { type: String, required: true },
    teacher: { type: String }
});

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);

// --- RESULT MODEL ---
const ResultSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    subjects: { type: [String], required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentClass: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    testDate: { type: Date, required: true },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema);

module.exports = {
    User,
    StudentProfile,
    AdminProfile,
    Homework,
    Announcement,
    Schedule,
    Result
};
