import mongoose from "mongoose"


const bookingSchema = new mongoose.Schema({
    clientName: {type: String, required: true},
    clientEmail: {type: String, required: true},
    date: {type:  Date , required: true},
    time: {type: String, required: true},
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'], // defino posibles estados
        default: 'pending' // asigno estado por defecto
    },
    services: [
    {
      service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
      quantity: { type: Number, default: 1, min: 1 }
    }
  ]
})

export default mongoose.model("Booking", bookingSchema)