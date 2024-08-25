const express = require('express') // require --> commonJS
const crypto = require('node:crypto')
const cors = require('cors')

const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGIN = [
            'http://localhost:8080',
            'http://localhost:1234',
            'http://movies.com',
            'http://midu.dev'
        ]
        if (ACCEPTED_ORIGIN.includes(origin)){
            return callback(null, true)
        }
        
        if (!origin){
            return callback(null, true)
        }
c
        return callback (new Error('Not allowed by CORS'))
    }
}))
app.disable('x-powered-by') // deshabilitar el header X-Powered-By: Express

// Todos los recursos que sean MOVIES se identifica con /movies
app.get('/movies', (req, res) => {
    const { genre } = req.query
    if (genre){
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() == genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to -regexp
    const { id } = req.params
    const movie = movies.find(movie => movie.id == id)
    if (movie) return res.json(movie)
    res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
    // la validacion
    const result = validateMovie(req.body)
    
    // si el result de la validacion 
    // da error manda mensaje 400
    if (result.error){
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    // en base de datos
    const newMovie = {
        id: crypto.randomUUID(), // uuid v4
        ...result.data
    }
    // Esto no seria REST, porque estamos guardando
    // el estado de la aplicacion en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie) // actualizar la cache del cliente
})

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const moviesIndex = movies.findIndex(movie => movie.id === id)

    if (moviesIndex == -1) {
        return res.status(404).json({ message: 'Movies not found' })
    }

    movies.splice(moviesIndex, 1)

    return res.json({ message: 'Movies deleted' })
})

app.patch('/movies/:id', (req,res) => {
    const result = validatePartialMovie(req.body)
    
    if (!result.success){
        return res.status(404).json({ errror: JSON.parse(result.error.message) })
    }
    
    // recuperamos la id
    const { id } = req.params
    // buscar pelicula
    const movieIndex = movies.findIndex(movie => movie.id == id)
    //si no encuentra la pelicula manda mensaje error 404
    if (movieIndex == -1) {
        return res.status(404).json({ message: 'movie not found' })
    }

    const updateMovie = {
        //todo lo que tenemos en movieIndex
        ...movies[movieIndex],
        // todo lo que tenemos en result.data
        ...result.data
    }
    
    // guardar esta pelicula en el indice
    movies[movieIndex] = updateMovie

    // devolvemos el json de la pelicula actualizada
    return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
})