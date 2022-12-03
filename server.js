const express = require('express')
const Contenedor = require('./entregableManejoDeArchivos.js')
const { Router } = express


/// Creando contenedor 


const productos = new Contenedor('productos')
const carritos = new Contenedor('carritos')
const admin = true


/////  Servidor

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/static', express.static(__dirname + '/public'))

const PORT = process.env.PORT || 8080

const routerApiProductos = new Router()
const routerApiCarrito = new Router()


////// PRODUCTO

//devuelve todos los productos o un producto según su id
routerApiProductos.get('/:id?', async (req, res) => {
    if(!req.params.id) {
        res.json(await productos.getAll())
    }
    let id = Number(req.params.id)
    if ( !(await productos.getAll()).find(el => el.id == id) ) {
        res.json({ "error" : 'producto no encontrado' })
    }
    res.json(await productos.getById( id ))    
})

//recibe y agrega un producto, y lo devuelve con su id asignado
routerApiProductos.post('/', async (req, res) => {
    if (!admin) {
        res.send({"error":'Solo los admin pueden cargar productos'})
    } else {
        let prodAgregar = req.body
        prodAgregar.timestamp = Date.now()
        await productos.save(prodAgregar)
        res.json( await productos.getById(Object.keys( await productos.getAll()).length) )
    }
})

//recibe y actualiza un producto según su id
routerApiProductos.put('/:id', async (req, res, err) => {
    if (!admin) {
        res.send({"error":'Solo los admin pueden cargar productos'})
    } else {
        let id = Number(req.params.id)
        if ( !(await productos.getAll()).find(el => el.id == id) ) {
            res.json({ "error" : 'producto no encontrado' })
        }
        let obj = req.body
        obj.id = id
        await productos.changeById(obj, id)
        res.json({"ok": 'producto actualizado'})
    }
})

//elimina un producto según su id
routerApiProductos.delete('/:id', async (req, res, err) => {
    let id = Number(req.params.id)
    if ( !(await productos.getAll()).find(el => el.id == id) ) {
        res.json({ "error" : 'producto no encontrado' })
    }
    await productos.deleteById(id)
    res.json({"ok": 'producto producto eliminado'})
})



////// CARRITO

//Devuelve todos los carritos
routerApiCarrito.get('/', async (req, res) => {
    res.json( await carritos.getAll() )
})


//Crea un carrito y devuelve su id
routerApiCarrito.post('/', async (req, res) => {
    let carritoAgregar = req.body
    carritoAgregar.timestamp = Date.now()
    await carritos.save(carritoAgregar)
    let carritoCreado = await carritos.getById(Object.keys( await carritos.getAll()).length)
    res.json( { "id del carrito nuevo": carritoCreado.id } )
})

//Vacía un carrito y lo elimina
routerApiCarrito.delete('/:id', async (req, res, err) => {
    let id = Number(req.params.id)
    if ( !(await carritos.getAll()).find(el => el.id == id) ) {
        res.json({ "error" : 'carrito no encontrado' })
    }
    await carritos.deleteById(id)
    res.json({"ok": 'carrito eliminado'})
})

//Me permite listar todos los productos guardados en el carrito
routerApiCarrito.get('/:id/productos', async (req, res) => {
    let id = Number(req.params.id)
    let carrito = await carritos.getById( id )
    if ( !carrito ) {
        res.json({ "error" : 'carrito no encontrado' })
    }
    res.json( carrito.productos )    
})

//Para incorporar productos al carrito por su id de producto
routerApiCarrito.post('/:id1/productos/:id2', async (req, res) => {
    let idCarrito = Number(req.params.id1)
    let idProducto = Number(req.params.id2)
    if ( !(await carritos.getAll()).find(el => el.id == idCarrito) ) {
        res.json({ "error" : 'carrito no encontrado' })
    }
    if ( !(await productos.getAll()).find(el => el.id == idProducto) ) {
        res.json({ "error" : 'el producto no existe' })
    }
    if ( (await carritos.getAll()).find(el => el.id == idCarrito).productos.find(el => el.id == idProducto) ) {
        res.json({ "error" : 'el producto ya existe en el carrito' })
    }
    let carritoModificado = await carritos.getById( idCarrito )
    let alCarrito = await productos.getById( idProducto )
    carritoModificado.productos.push( alCarrito )
    await carritos.changeById( carritoModificado, idCarrito )
    res.json( {"ok": 'se agrego el producto al carrito'} )    
})

//Eliminar un producto del carrito por su id de carrito y de producto
routerApiCarrito.delete('/:id/productos/:id_prod', async (req, res) => {
    let idCarrito = Number(req.params.id)
    let idProducto = Number(req.params.id_prod)
    if ( !(await carritos.getAll()).find(el => el.id == idCarrito) ) {
        res.json({ "error" : 'carrito no encontrado' })
    }
    if ( !(await productos.getAll()).find(el => el.id == idProducto) ) {
        res.json({ "error" : 'el producto no existe' })
    }
    if ( !( (await carritos.getAll()).find(el => el.id == idCarrito).productos.find(el => el.id == idProducto)) ) {
        res.json({ "error" : 'el producto no existe en el carrito' })
    }
    let carritoModificado = await carritos.getById( idCarrito )
    carritoModificado.productos = carritoModificado.productos.filter(element => Number(element.id) !== idProducto)
    await carritos.changeById( carritoModificado, idCarrito )
    res.json( {"ok":'El producto fue quitado del carrito'} )    
})


/////

app.use('/api/productos', routerApiProductos)
app.use('/api/carrito', routerApiCarrito)


////// para todas las demas rutas

app.get("*", (req, res) => {
    res.json(  {"error":'la ruta no existe'} )
});


const server = app.listen(PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${server.address().port}`)
})


