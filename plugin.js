var lastUpdate = null;
const regions = {
    "Andalucía": { number: 1, url:"/comunidad-1-andalucia.html "},
    "Aragón": { number: 2, url:"comunidad-2-aragon.html" },
    "Asturias": { number: 3, url:"/comunidad-3-asturias.html" },
    "Canarias": { number: 6, url:"/comunidad-6-canarias.html" },
    "Cantabria": { number: 7, url:"/comunidad-7-cantabria.html" },
    "Castilla y León": { number: 9, url:"/comunidad-9-castilla-y-leon.html" },
    "Castilla-La Mancha": { number: 8, url:"comunidad-8-castilla-la-mancha.html" },
    "Cataluña": { number: 10, url:"/comunidad-10-cataluna.html" },
    "Comunidad de Madrid": { number: 13, url:"/comunidad-13-comunidad-de-madrid.html" },
    "Comunidad Valenciana": { number: 17, url:"comunidad-17-comunidad-valenciana.html" },
    "Extremadura": { number: 11, url:"/comunidad-11-extremadura.html" },
    "Galicia": { number: 12, url:"/comunidad-12-galicia.html" },
    "Islas Baleares": { number: 4, url:"/comunidad-4-islas-baleares.html" },
    "La Rioja": { number: 16, url:"/comunidad-16-la-rioja.html" },
    "Navarra": { number: 15, url:"/comunidad-15-navarra.html" },
    "País Vasco": { number: 5, url:"/comunidad-5-pais-vasco.html" },
    "Región de Murcia": { number: 14, url:"/comunidad-14-region-de-murcia.html" }
  };
const getUrl = (region) => regions[region] ? regions[region] : { number: null, url: "https://www.embalses.net/" };

function load() {

	if (lastUpdate != null) {
	    // check the interval provided by the user
        console.log(`interval = ${interval}`);
	    let delta =  parseInt(interval) * 24 * 60 * 60 * 1000; // minutes → milliseconds
	    let future = (lastUpdate.getTime() + delta);
	    let now = (new Date()).getTime();
	 	if (now < future) {
	 		// time has not elapsed, return no results
	 		console.log(`time until next update = ${(future - now) / 1000} sec.`);
	 		processResults(null);
	 		return;
	 	}
	 }
    const comunidad = getUrl(comunidad_autonoma);


	const endpoint = `${site}` + comunidad.url;
    console.log(`ENDPOINT check: ${endpoint}`);
	sendRequest(endpoint)
	.then((text) => {
		let uri = endpoint;

        // ITEM DATE
		var date = new Date();
		const dateMatch = text.match(/Última actualización:\s*<b>(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})<\/b>/);
        
		if (dateMatch && dateMatch[1]) {
            const dateString = dateMatch[1];
            const [day, month, year, hour, minute] = dateString.match(/\d+/g).map(Number);
            date = new Date(year, month - 1, day, hour, minute);
            console.log(`Extracted date: ${date}`);
        } else {
            console.log('No date found in the specified format');
        }

        //CREATE ITEM WITH URI AND DATE
		let item = Item.createWithUriDate(uri, date);

        // ITEM TITLE
        item.title = comunidad_autonoma;

        // ITEM ATTACHMENTS
        var attachments = [];
        var mediaAttachment = MediaAttachment.createWithUrl('https://www.embalses.net/cache/w-a-'+ comunidad.number +'.jpg');
        mediaAttachment.aspectSize = {width : 560, height: 250};
        attachments.push(mediaAttachment);

        const graphTitle = "Gráfico anual, con datos semanales. Se muestran los datos del año en curso, de los 2 años anteriores y de la media de los últimos años";
        const imgSrcMatch = text.match(new RegExp(`<img[^>]+src="([^">]+)"[^>]*title="${graphTitle}"*[^>]*>`));
        if (imgSrcMatch && imgSrcMatch[1]) {
            const imgSrc = imgSrcMatch[1];
            console.log(`Image source: ${imgSrc}`);
		 	src = `${site}${imgSrc}`
		 	mediaAttachment = MediaAttachment.createWithUrl(src);
		 	mediaAttachment.aspectSize = {width : 560, height: 250};
            attachments.push(mediaAttachment);
        } else {
             console.log('No image source found with the specified title');
        }
        item.attachments = attachments;

        //// ITEM BODY
        const filaSecciones = text.match(/<div[^>]*class="FilaSeccion"[^>]*>([\s\S]*?)<\/div>/g);
        const filaResultado = text.match(/<div[^>]*class="Resultado"[^>]*>([\s\S]*?)<\/div>/g);
        const filaunidad = text.match(/<div[^>]*class="Unidad"[^>]*>([\s\S]*?)<\/div>/g);
        var body = '';
        if (filaSecciones && filaSecciones.length > 0) {

            for (let index = 0; index < filaSecciones.length; index++) {
                const campo =  filaSecciones[index].match(/class="Campo"[^>]*>([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]*>/g, '').trim() || '';
                const resultado = filaResultado[index*2].match(/class="Resultado"[^>]*>([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]*>/g, '').trim() || '';
                const unidad =  filaunidad[index].match(/class="Unidad"[^>]*>([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]*>/g, '').trim() || '';
                const resultado2 = filaResultado[(index*2)+1].match(/class="Resultado"[^>]*>([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]*>/g, '').trim() || '';

                if (index === 0){
                    body = body + campo + ' ' + resultado + ' ' + unidad + ' - ' + resultado2 +  '%  <br><br>';
                    body = body + '<table><tr>';
                } else {
                    body = body + '<tr>';
                }
                body = body + '<td>' + campo + '</td>';
                body = body + '<td>' + resultado + ' ' + unidad + '</td>';
                body = body + '<td>' + resultado2 + ' %</td>';
                body = body + '</tr>';
            }
            body = body + '</table>';
            item.body = body;
        } else {
            console.log('No FilaSeccion elements found in the HTML');
        }

		let items = [item];
		processResults(items);
		lastUpdate = new Date();
	})
	.catch((requestError) => {
		processError(requestError);
	});
}