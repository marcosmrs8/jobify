const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const path = require('path')

const sqlite = require('sqlite')
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), {Promise})

const port = process.env.PORT || 3000

app.use('/admin', (req, res, next) => {
    if(req.hostname === 'localhost'){
    next()
    }else{
        res.send('Not allowed')
    }
})

app.set ('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: true }))


app.get('/', async (request, response) => {
    const db = await dbConnection
    const categoriasDb = await db.all('select * from categorias; ')
    const vagas = await db.all('select * from vagas;')
    const categorias = categoriasDb.map(cat =>{
        return {
            ...cat,
            vagas: vagas.filter(vaga => vaga.categoria === cat.id)
        }
    })
    response.render('home', {
        categorias
    }) 
        
})    

app.get('/vaga/:id', async (request, response) => {
    console.log(request.params.id)
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id = '+request.params.id)
    console.log(vaga)
    response.render('vaga', {
        vaga
    }) 

})
app.get('/admin/vagas/nova', async(req, res) =>{
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/nova-vaga', {categorias})
})

app.get('/admin', (req, res) =>{
    res.render('admin/home')
})

app.get('/admin/vagas', async(req, res)=>{
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')    
    res.render('admin/vagas', {vagas})
})

app.get('/admin/vagas/delete/:id', async(req, res) => {
    const db = await dbConnection
    await db.run('delete from vagas where id = '+req.params.id+'')
    res.redirect('/admin/vagas')
})

app.post('/admin/vagas/nova', async(req,res) =>{
    const { titulo, descricao, categoria } = req.body
    const db = await dbConnection
    await db.run(`insert into vagas(categoria, titulo, descricao) values(${categoria}, '${titulo}', '${descricao}') `)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async(req, res) =>{
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vaga = await db.get('select * from vagas where id =' +req.params.id)
    res.render('admin/editar-vaga', { categorias, vaga })
})
app.post('/admin/vagas/editar/:id', async(req,res) =>{
    const { titulo, descricao, categoria } = req.body
    const { id }= req.params
    const db = await dbConnection
    await db.run(`update vagas set categoria = ${categoria}, titulo= '${titulo}', descricao = '${descricao}' where id = ${id}`)
    res.redirect('/admin/vagas')
})

const init = async() => {
    const db = await dbConnection
    await db.run('create table if not exists categorias(id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas(id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT , descricao TEXT);')
   
    // const categoria = 'Marketing team'
    //await db.run(`insert into categorias(categoria) values('${categoria}')`)

}
init()

app.listen(port, (err)=>{
    if (err){
        console.log('Não foi possivel iniciar o servidor JOBIFY')

    }else{
        console.log('Servidos do JOBIFY rodando...')
    }
})