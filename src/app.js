

// const MODELS_URL = './../models'
const video =  document.getElementById("video") //video que transmitirá a imagem da webcam
const canvas = document.getElementById('canvas') //canvas com as animações
let recortar =  true



//Carregar Modelos
console.log("Carregando modelos...")
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('../models/'),
    faceapi.nets.faceRecognitionNet.loadFromUri('../models/'),
]).then(()=>{
    console.log("Modelos carregados..."); 
    //return iniciarVideo()
    return document.body.addEventListener('click', ()=> {
        iniciarVideo()
    })
      
})


//Iniciar webcam após todos os modelos carregados

// navigator.getMedia = ( navigator.getUserMedia ||
//     navigator.webkitGetUserMedia ||
//     navigator.mozGetUserMedia ||
//     navigator.msGetUserMedia);


    // video.srcObject = mobile
    //habilitar botao de download após o video ser iniciado
    // document.getElementById('download').addEventListener('click', e=> {
    //     iniciarMonitoramento(canvas, video)
    // })
    iniciarMonitoramento(canvas, video)
//{ video: {facingMode: "user"} } //informar que deseja utilizar a webcam do usuario ou a camera frontal
function iniciarVideo() {
    // video.src = mobile
    // //habilitar botao de download após o video ser iniciado
    // document.getElementById('download').addEventListener('click', e=> {
    //     iniciarMonitoramento(canvas, video)
    // })
    // iniciarMonitoramento(canvas, video)
    // console.log(mobile)
    //navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    navigator.mediaDevices.getUserMedia({video: true}).then(stream => {

        //informar a fonte do video
        video.srcObject = stream

        // //habilitar botao de download após o video ser iniciado
        // document.getElementById('download').addEventListener('click', async e => {
        //     console.log(box)

        //     console.log("Região extraída",regionsToExtract)
        //     const canvasFoto = await faceapi.extractFaces(video, regionsToExtract)

        //     console.log(canvasFoto)
        //     tirarFoto(video, canvasFoto).then(download)
        // })

        document.getElementById('download').addEventListener('click', e=> {
            iniciarMonitoramento(canvas, video)
        })

        
    }).catch(err => console.log(err))
}


async function detectarRosto(displaySize, video) {
    //detectar rostos
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    
    // definir o tamanho do reconhecimento com a posição do rosto
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    
   
    
    if(resizedDetections.length > 0) {
        //retorna apenas o que o possuem nível de confiança maior que 80%
        console.log("Rosto Detectado", resizedDetections)
        return resizedDetections.filter(detection => detection.classScore > 0.6) 
    }
    
}

async function iniciarMonitoramento(canvas, video) {
    // definir tamanho do canvas com as dimensões do video
    const displaySize = {width: video.width, height: video.height}
    faceapi.matchDimensions(canvas, displaySize)
    //Detectar Rostos a cada intervalo de 200 ms
    ref = setInterval( async () => {
        const detections = await detectarRosto(displaySize, video)
        //console.log(detections)
        
        if(detections) {
            //limpar o canvas desenhado previamente
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        
            //desenhar de novo
            faceapi.draw.drawDetections(canvas, detections)
            if(recortar) {
                const regions = detections.map(async detection => {
                    const regionsToExtract = createBox(detection.box.x, detection.box.y, detection.box.width, detection.box.height)
                    const canvasFoto = await faceapi.extractFaces(video, regionsToExtract.regionsToExtract)
                    console.log("CanvasObtido", canvasFoto)
                    return { canvasFoto, box: regionsToExtract.box }
                })
        
                regions.forEach(region=> {
                    region.then(canvasFoto => {
                        tirarFoto(video, canvasFoto).then(download)
                        recortar = false
                        console.log("esperando")
                        setTimeout(()=>{
                            
                            recortar = true
                            console.log("chega de esperar")
                        },  10000)
                        // console.log("foto")
                        // 
    
                    })
    
                })
            }

        }


    }, 200)
}

async function tirarFoto(video, canvasFotos) {
   
    const canvasFoto = canvasFotos.canvasFoto[0]
    
    console.log(canvasFoto)
    const ctx = canvasFoto.getContext('2d')
    

    ctx.drawImage(video,canvasFotos.box.x, canvasFotos.box.y)
    console.log(ctx)
    return new Promise((res, rej) => {
        canvasFoto.toBlob(res, 'image/jpeg')
    })

}

// //Referencia do Storage do Firebase
// let storageRef = firebase.storage().ref();
// let imagesRef =  storageRef.child('fotos')

function download(blob) {
    console.log("baixando")
    let a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'rosto.jpg'
    document.body.appendChild(a)
    a.click()
    

    
}

function createBox(x, y, width, height) {
    const box = {x: 0, y: 0, width: 0, height: 0} // caixa do rosto
    box.x = x
    box.y = y
    box.width = width
    box.height = height

    const regionsToExtract = [ new faceapi.Rect(box.x-60, box.y -120, box.width, box.height +120) ]
    
    return {regionsToExtract, box}
}