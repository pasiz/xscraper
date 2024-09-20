(function() {
    if (window.location.hostname !== 'x.com') {
        console.error('Please run this script on x.com.');
        return;
    }
    
    // Variables and selectors to tune

    const queryALL = true;
    const DEBUG = false;
    const queryText = '[data-testid="tweetText"]';
    const queryAuthor = 'a.css175oi2r.r-1wbh5a2.r-dnmrzs span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3';
    const queryTime = 'time';
    const queryRepost = 'svg.r-4qtqp9.r-yyyyoo.r-dnmrzs.r-bnwqim.r-lrvibr.r-m6rgpd.r-115tad6.r-10ptun7.r-1janqcz g path';
    const scrollInterval = 200; // Scrolling interval (default 200)
    const scrollStep = 400; // Pixels to scroll on each step (default 400)

    // End of tunables

    let tweets = []; // Initialize an empty array to hold all tweet elements
    let tweet_elements = [];
    if(DEBUG)
        console.log("scrollStepping: ", scrollStep);

    let previousTweetCount = 0;
    let unchangedCount = 0;
    const username = window.location.pathname.split('/')[1] || 'unknown';

    console.log("scraping user tweets :@",username);

    const scrollToEndIntervalID = setInterval(() => {
        window.scrollBy(0, scrollStep);
        setTimeout(() => {}, scrollInterval);
        const currentTweetCount = tweets.length;
        if (currentTweetCount === previousTweetCount) {
            unchangedCount++;
            if (unchangedCount >= 30) { // Stop if the count has not changed N times
                console.log('Scraping complete');
                console.log('Total elements scraped: ', tweets.length);
                clearInterval(scrollToEndIntervalID); // Stop scrolling
                observer.disconnect(); // Stop observing DOM changes
                indexMarker = 1;
                twDOM = "";
                tweets.forEach(TwResult => {
                    twDOM += TwResult;
                });
                if(DEBUG)
                    console.log("tweetDOM size is ", twDOM.length);
                const parser = new DOMParser;
                const tws =  parser.parseFromString(twDOM, "text/html");
                tws.querySelectorAll('[data-testid="tweet"]').forEach(tweetEL => {
                    const textElement = tweetEL.querySelector(queryText)?.innerHTML.replace(/<[^>]*>/g, '') || "";
                    const authorElement = tweetEL.querySelector(queryAuthor)?.innerText || username;
                    const timestampElement = tweetEL.querySelector(queryTime);
                    if(tweetEL.querySelector(queryRepost))
                        isRepost = 1;
                    else
                        isRepost = 0;
                    if(DEBUG)
                        console.log(textElement);
                    const urlElement = `https://x.com${timestampElement.parentElement.getAttribute('href')}`;
                    //twAuthor = tweetEL.querySelector('.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3')?.innerText || "";
                    const tweetMarker = {
                            id: indexMarker,
                            is_repost: isRepost,
                            tweet_author: authorElement,
                            tweet_content: textElement,
                            timestamp: timestampElement.getAttribute('datetime'),
                            url: urlElement,
                            scrapeurl: window.location.href
                    };
                    if(!queryALL){
                        if(authorElement === username){
                            tweet_elements.push(tweetMarker);
                            indexMarker++;
                        }
                        else if(DEBUG){
                            console.log("Author not match -", authorElement);
                            console.log("shoud be: -", username);
                        }
                    }
                    else {
                        tweet_elements.push(tweetMarker)  ;
                        indexMarker++;  
                    }
                });
                console.log("scraped tweets count: ",indexMarker-1);
                console.log('Downloading tweets as JSON...');
                downloadTweetsAsJson(tweet_elements); // Download the tweets list as a JSON file
            }
        } else {
            unchangedCount = 0; // Reset counter if new tweets were added
        }
        previousTweetCount = currentTweetCount; // Update previous count for the next check
    }, scrollInterval);

    function updateTweets() {
        document.querySelectorAll('[data-testid="cellInnerDiv"]').forEach(tweetElement => {
            tweetText = tweetElement.innerHTML;
            if (!tweets.includes(tweetText)) { // Check if the tweet's text is not already in the array
                tweets.push(tweetText); // Add new tweet's text to the array
                console.log("Elements scraped: ", tweets.length)
            }
        });
    }

    // Initially populate the tweets array
    updateTweets();

    // Create a MutationObserver to observe changes in the DOM
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                //console.log("updated");
                updateTweets(); // Call updateTweets whenever new nodes are added to the DOM
            }
        });
    });

    // Start observing the document body for child list changes
    observer.observe(document.body, { childList: true, subtree: true });

    function downloadTweetsAsJson(tweetsArray) {
        const jsonData = JSON.stringify(tweetsArray); // Convert the array to JSON
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = username + '_tweets_'+ Date.now() +'.json'; // Specify the file name
        document.body.appendChild(link); // Append the link to the document
        link.click(); // Programmatically click the link to trigger the download
        document.body.removeChild(link); // Clean up and remove the link
    }
})();
