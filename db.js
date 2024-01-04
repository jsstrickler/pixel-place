const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const createCanvas = async () => {
	try {
		const initialColorCode = "2" // Color code for white
		const canvasSize = 128 // Assuming a 128x128 canvas
		const pixelCount = canvasSize * canvasSize

		// Convert the binary color code to a binary buffer
		const initialBuffer = Buffer.from(
			initialColorCode.repeat(pixelCount),
			"hex"
		)

		// Create a new canvas record in the database
		const newCanvas = await prisma.canvas.create({
			data: {
				pixels: initialBuffer,
			},
		})

		console.log("Canvas created successfully:", newCanvas)
	} catch (error) {
		console.error("Error creating canvas:", error)
	} finally {
		await prisma.$disconnect()
	}
}

createCanvas()
