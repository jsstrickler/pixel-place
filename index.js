// initialize server
const express = require("express")
const { disconnect } = require("process")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server)
const port = process.env.PORT || 3000
const bodyParser = require("body-parser")
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + "/public"))

// decode pixel colors
const colors = [
	"rgb(0, 0, 0)",
	"rgb(137, 141, 144)",
	"rgb(255, 255, 255)",
	"rgb(212, 215, 217)",
	"rgb(156, 105, 38)",
	"rgb(255, 153, 170)",
	"rgb(180, 74, 192)",
	"rgb(129, 30, 159)",
	"rgb(81, 233, 244)",
	"rgb(54, 144, 234)",
	"rgb(36, 80, 164)",
	"rgb(126, 237, 86)",
	"rgb(0, 163, 104)",
	"rgb(255, 214, 53)",
	"rgb(255, 168, 0)",
	"rgb(255, 69, 0)",
]
const canvasSize = 128
const canvasId = "6596fada2514cf4b96ee72c0"

io.on("connection", (socket) => {
	console.log("user connected")

	socket.on("pixelPlaced", async (data) => {
		io.emit("pixelReceived", data)

		const oldCanvas = await prisma.canvas.findUnique({
			where: {
				id: canvasId,
			},
		})
		let pixels = oldCanvas.pixels

		const colorValue = colors.indexOf(data.col)
		const clampedColorValue = Math.max(0, Math.min(15, colorValue))
		const position = data.x + data.y * canvasSize

		const existingByte = pixels.readUInt8(position >> 1)
		const shiftAmount = position % 2 ? 0 : 4
		const clearedByte = existingByte & (0xff ^ (0xf << shiftAmount))
		const packedByte = clearedByte | (clampedColorValue << shiftAmount)
		pixels.writeUInt8(packedByte, position >> 1)

		const updatedCanvas = await prisma.canvas.update({
			where: {
				id: canvasId,
			},
			data: {
				pixels: pixels,
			},
		})
	})

	socket.on("disconnect", () => {
		console.log("user disconnected")
	})
})

app.get("/api/canvas", async (req, res) => {
	const canvas = await prisma.canvas.findUnique({
		where: {
			id: canvasId,
		},
		select: {
			pixels: true,
		},
	})

	res.send(canvas.pixels)
})

server.listen(port, function () {
	console.log(`App listening on port: ${port}`)
})
