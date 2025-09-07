# Test Postman Corretto per Unsplash API

## Setup per il test:

**URL**: `https://api.unsplash.com/search/photos`
**Method**: GET

### Headers:
```
Authorization: Client-ID se20Tam8o6r7Uo_mtAbxpslerdh1e_5w7Ittb3PYh2Q
```

### Query Parameters:
```
query: fioraio
per_page: 12
orientation: landscape
```

### URL completo per Postman:
```
https://api.unsplash.com/search/photos?query=fioraio&per_page=12&orientation=landscape
```

## Risposta attesa:
Se funziona, dovresti ricevere un JSON con:
```json
{
  "total": 123,
  "total_pages": 11,
  "results": [
    {
      "id": "photo-id",
      "urls": {
        "small": "https://images.unsplash.com/...",
        "regular": "https://images.unsplash.com/..."
      },
      "alt_description": "descrizione immagine"
    }
  ]
}
```
