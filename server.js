
const express = require('express');
const app =express();
const port = 4000;

const cors= require('cors');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// Middleware
app.use(express.json());
const userRoute = require('./routes/user.route');
const auth=require('./routes/auth.route');
const presensiRoute = require('./routes/presensi.route');
const groupRoute = require('./routes/group.route');

app.use('/api/auth',auth);
app.use('/api/users', userRoute);
app.use('/api/attendance', presensiRoute);
app.use('/api/group', groupRoute);

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
