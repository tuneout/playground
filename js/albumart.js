const albumArt = async ( artist, options, cb ) => {
    // Massage inputs
    if ( typeof artist !== 'string' ) {
        throw new TypeError( 'Expected search query to be a string' )
    }

    if ( typeof options === 'function' ) {
        cb = options
        options = null
    }

    if ( typeof cb !== 'function' ) {
        cb = null
    }

    // Default options
    artist = artist.replace( '&', 'and' )
    const opts = Object.assign( {
        album: null,
        size: null
    }, options )

    // Image size options
    const SIZES = {
        SMALL: 'small',
        MEDIUM: 'medium',
        LARGE: 'large'
    }

    // Public Key on purpose - don't make me regret this
    const apiEndpoint = 'https://api.spotify.com/v1'
    const authEndpoint = 'https://accounts.spotify.com/api/token'
    const clientId = '3f974573800a4ff5b325de9795b8e603'
    const clientSecret = 'ff188d2860ff44baa57acc79c121a3b9'

    // Create request URL
    const method = 'track';//( opts.album === null ) ? 'artist' : 'album'
    const queryParams = `?q=${encodeURIComponent( artist )}&type=track&limit=1`
    const searchUrl = `${apiEndpoint}/search${queryParams}`
    const authString = `${clientId}:${clientSecret}`

    let authorization
    if ( typeof btoa !== 'undefined' ) {
        authorization = btoa( authString )
    } else if ( Buffer ) {
        authorization = Buffer.from( authString ).toString( 'base64' )
    } else {
        throw new Error( 'No suitable environment found' )
    }

    // Start by authorizing a session
    const authToken = await fetch( authEndpoint, {
        method: 'post',
        body: 'grant_type=client_credentials',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${authorization}`
        }
    } )
        .then(
            res => res.json()
        )
        .then(
            json => json.access_token
        )

    // Perform image search
    let error = null
    const response = await fetch( searchUrl, {
        method: 'get',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${authToken}`
        }
    } )
        .then(
            res => res.json()
        )
        .then(
            json => {
                console.log(json, "______albumjson");
                if ( typeof ( json.error ) !== 'undefined' ) {
                    // Error
                    return Promise.reject( new Error( `JSON - ${json.error} ${json.message}` ) )
                }

                if ( !json[method + 's'] || json[method + 's'].items.length === 0 ) {
                    // Error
                    return Promise.reject( new Error( 'No results found' ) )
                }

                // Select image size
                var images = json[method + 's'].items[0].album.images

                let smallest = images[0]
                let largest = images[0]

                for ( const element of images ) {
                    if ( parseInt( element.width ) < parseInt( smallest.width ) ) {
                        smallest = element
                    }

                    if ( parseInt( element.width ) > parseInt( largest.width ) ) {
                        largest = element
                    }
                }

                if ( opts.size === SIZES.SMALL ) {
                    return smallest.url
                }

                if ( opts.size === SIZES.MEDIUM && images.length > 1 ) {
                    return images[1].url
                }
                // Large by default
                return largest.url
            }
        )
        .catch( error_ => {

            error = error_
            return error_

        } )

    // Callback
    if ( cb ) {
        return cb( error, response )
    }

    // Promise
    return response
}
