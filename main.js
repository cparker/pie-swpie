var onLoadFunction = function() {
    // customizations
    var appName = 'pie-swipe'
    var googleImageSearch = 'cherry pie';
    var welcomeMessage = 'Welcome to Pie Match!';
    var welcomeImageURL = '/pumpkin-pie-slice.png';

    const databaseAPIURL = 'https://pie-swipe.herokuapp.com/swipe'

    var arrowTime = 1000;
    var computeTime = 3000;
    var likeCount = 0;
    var dontLikeCount = 0;

    var xDown = null;
    var yDown = null;
    var pieResultsJSON = null;
    var pieWrapperElm = null;
    var pieImageElm = null;
    var pieInfoElm = null;
    var pieImageIndex = 0;
    var bodyElm = null;
    var googImageStart = 1;
    var imagesPerRequest = 10;
    var loadingElm = null;
    var piePicElm = null;
    var introElm = null;
    var mainContentElm = null;
    var topRightArrowElm = null;
    var topLeftArrowElm = null;
    var swipeCountElm = null;
    var computingContentElm = null;
    var finishContentElm = null;
    var likeCountElm = null;
    var dontLikeCountElm = null;
    var ratioElm = null;
    var secretPiElm = null;
    var topTitleElm = null;
    var introPicElm = null;

    function fetchStats(url) {
        // "http://localhost:5000/swipe?url=xyz&appName=pie"
        return fetch(`${databaseAPIURL}?url=${url}&appName=${appName}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(stats => {
                return stats
            })
            .catch(err => {
                console.log('error fetching stats', err)
            })
    }

    function nextPieImage() {
        if (pieImageIndex < pieResultsJSON.items.length - 1) {
            pieImageIndex++;

            // remove old
            pieImageElm.parentNode.removeChild(pieImageElm);

            // add new
            pieImageElm = document.createElement('img');
            pieImageElm.classList.add('pie-image');
            pieWrapperElm.appendChild(pieImageElm);
            pieImageElm.src = pieResultsJSON.items[pieImageIndex].link;
            updateSwipeCount()
            // pieInfoElm.innerHTML = pieResultsJSON.items[pieImageIndex].title;
            // console.log('NOW SHOWING', pieResultsJSON.items[pieImageIndex]);
        }
        else {
            googImageStart += imagesPerRequest;
            loadPies()
        }
    }

    function displayComputeFinish() {
        computingContentElm.style.display = 'block';
        mainContentElm.style.display = 'none';

        setTimeout(function() {
            computingContentElm.style.display = 'none';
            finishContentElm.style.display = 'flex';
        }, computeTime)
    }

    function updateSwipeCount() {
        if (pieResultsJSON) {
            fetchStats(pieResultsJSON.items[pieImageIndex].link, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })
                .then(s => {
                    return s.json()
                })
                .then(stats => {
                    console.log('got stats', stats)

                    likeCountElm.innerHTML = `${stats.totalUp}`
                    dontLikeCountElm.innerHTML = `${stats.totalDown}`
                })
        }
        /*
            
        likeCountElm.innerHTML = `${likeCount}`
        dontLikeCountElm.innerHTML = `${dontLikeCount}`
        var pct = (likeCount*100 / (dontLikeCount + likeCount)).toFixed(2)
        if(likeCount+dontLikeCount>0){
            if(dontLikeCount>0){
                ratioElm.innerHTML = `${pct}%  ${(likeCount/dontLikeCount).toFixed(2)}`+" like ratio"
            }else{
                ratioElm.innerHTML = `Everybody likes this!`
            }
            console.log(`${(likeCount/dontLikeCount).toFixed(2)}`)
        }else{
            console.log('No one has seen this pie image yet.')
            ratioElm.innerHTML = `---`
        }
        */
        if (`${(likeCount/dontLikeCount).toFixed(2)}`.startsWith('3.1')) {
            secretPiElm.style.display = 'block'
        }
        else {
            secretPiElm.style.display = 'none'
        }

    }

    function sendVote(url, vote) {
        const postBody = {
            appName: appName,
            url: url,
            vote: vote
        }

        fetch(databaseAPIURL, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(postBody)
            })
            .then(r => {
                console.log('vote response', r)
            }).catch(err => {
                console.log('error', err)
            })

    }

    function handleRightSwipe() {
        console.log('right swipe');
        // pieInfoElm.innerHTML = 'right swipe';
        topRightArrowElm.style.opacity = 1.0;
        setTimeout(function() {
            topRightArrowElm.style.opacity = 0.0;
        }, arrowTime)
        likeCount++;

        nextPieImage();

        sendVote(pieResultsJSON.items[pieImageIndex].link, 1)
    }

    function handleLeftSwipe() {
        console.log('left swipe')
        // pieInfoElm.innerHTML = 'left swipe';
        topLeftArrowElm.style.opacity = 1.0;
        setTimeout(function() {
            topLeftArrowElm.style.opacity = 0.0;
        }, arrowTime)
        dontLikeCount++;

        nextPieImage();

        sendVote(pieResultsJSON.items[pieImageIndex].link, -1)
    }

    function loadPies() {
        console.log('loadingPies');
        var apiKey = 'AIzaSyCprvnzyAa5zEonOCIqAlDkiQwrV9lyReg';
        var searchEngineID = '016055755740953569891:z66vcomx364';
        var query = encodeURIComponent(googleImageSearch);

        fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineID}&searchType=image&q=${query}&num=${imagesPerRequest}&safe=medium&start=${googImageStart}`)
            .then(function(pieResults) {
                return pieResults.json();
            })
            .then(function(pieJSON) {
                console.log('pieJSON', pieJSON);
                if (!pieJSON.error) {
                    pieResultsJSON = pieJSON;
                    pieImageIndex = -1;
                    nextPieImage()
                }

                // hide loading
                loadingElm.style.display = 'none';
            })
            .catch(function(err) {
                console.log('error in search', err)
            })

    }

    function handlePieTouch(ev) {
        console.log('pie touch', ev)
        introElm.style.display = 'none';
        mainContentElm.style.display = 'flex';
    }

    console.log('loading');

    pieImageElm = document.querySelector('.pie-image');
    pieInfoElm = document.querySelector('.pie-info');
    pieWrapperElm = document.querySelector('.pie-image-wrapper');
    bodyElm = document.querySelector('body');
    loadingElm = document.querySelector('.loading');
    piePicElm = document.querySelector('.pie-pic');
    introElm = document.querySelector('.intro');
    mainContentElm = document.querySelector('.main-content');
    topRightArrowElm = document.querySelector('.top-arrow.right');
    topLeftArrowElm = document.querySelector('.top-arrow.left');
    swipeCountElm = document.querySelector('.swipe-count');
    computingContentElm = document.querySelector('.computing-content');
    finishContentElm = document.querySelector('.finish-content');
    likeCountElm = document.querySelector('.like-count');
    dontLikeCountElm = document.querySelector('.dont-like-count');
    ratioElm = document.querySelector('.ratio-num');
    secretPiElm = document.querySelector('.secret-pi');
    topTitleElm = document.querySelector('.intro .top-title');
    introPicElm = document.querySelector('.intro .pie-pic img');

    topTitleElm.innerHTML = welcomeMessage;
    introPicElm.src = welcomeImageURL;

    var hammertime = new Hammer(bodyElm, {});
    hammertime.on('swiperight', handleRightSwipe)
    hammertime.on('swipeleft', handleLeftSwipe)
    hammertime.on('tap', handlePieTouch)

    piePicElm.addEventListener('click', handlePieTouch)
    loadPies();
}

window.onload = onLoadFunction
