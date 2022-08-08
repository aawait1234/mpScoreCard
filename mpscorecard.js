// ==UserScript==
// @name         MountainProjectScoreCard
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       https://www.mountainproject.com/user/107585679/aaron-wait
// @match        https://www.mountainproject.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mountainproject.com
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js
// ==/UserScript==


var FRIENDS = [
    {
        name: "Aaron",
        ticksUrl: "https://www.mountainproject.com/user/107585679/aaron-wait/ticks"
    },
    {
        name: "Princess Puppy Lovr",
        ticksUrl: "https://www.mountainproject.com/user/200286072/princess-puppy-lovr/ticks"
    },
    {
        name: "Chode Rider",
        ticksUrl: "https://www.mountainproject.com/user/200903515/daniel-chode-rider/ticks"
    }

];


// prevents this script from breaking other JS on the page I think...
this.$ = this.jQuery = jQuery.noConflict(true);

(function() {
    'use strict';
    var CURRENT_PAGE = window.location.href;


    /*  
        ######################################################
        MAIN.js START
        ######################################################
    */

    addFriendsList();
    addScoreCardToUserPage();

    fixDropdowns();
    fixNotificationsDropdown();

    /*  
        ######################################################
        MAIN.js END
        ######################################################
    */




    /*  
        ######################################################
        AddFriendsList.js START
        ######################################################
    */

    /*
        Adds a friends list popover to the top of the page.
    */
    function addFriendsList() {
        var friendsList = $("#user-dropdown").clone();
        friendsList.find(".dropdown-toggle").attr("data-toggle","toggleThatShouldNotExist");
        friendsList.find(".user-img-avatar").replaceWith("<p id='friendListLabel' style='padding:5px; margin-right:5px;'>Friend's Score Cards</p>");
        $("#user").prepend("<div id='user-dropdown' class='dropdown friendsList'></div>");
        $(".friendsList").append(friendsList.html());
        $(".friendsList").append("<div id='friendTable' style='display:none;margin-bottom:5px;'><table></table></div>");
        $(".friendsList").append("<style>#friendTable td { border-style:solid; border-width: thin; padding:5px;}</style>");
        $(".friendsList").append("<style>#friendTable a { color:#34ebde; font-weight: bold; text-decoration: underline;}</style>");
        
        var friendsDataPromises = [];
        FRIENDS.forEach( friend => {
            var tickUrl = friend.ticksUrl;
            friendsDataPromises.push(collectRawRouteDataFrom(tickUrl)
                .then(scores => {
                    // pick response from the second or third promise if first pages of ticks are full
                    if (scores[0].length == 36) {
                        if (scores[1].length == 36) {
                            return scores[2];
                        } else {
                            return scores[1];
                        }
                    }
                    return scores[0];
                })  
                .then(rawData => generateScore(rawData))
                .then(function(score) {
                     $("#friendTable").append(" <tr><td><a href='" + tickUrl.slice(0,-6) + "''>" + friend.name + " </td><td>  " + score.total + " pts</td></tr><br>");
                }));
        });
        $('#friendListLabel').click(function() {
            $('#friendTable').toggle("slide");
        });
    }
    /*  
        ######################################################
        AddFriendsList.js END
        ######################################################
    */




    /*  
        ######################################################
        AddScoreCardToUserPage.js START
        ######################################################
    */

    /*
        Adds score card (top 5) content to a mountain project user's home page
    */
    function addScoreCardToUserPage() {
        // Add score to users main page.
        if (CURRENT_PAGE.includes("https://www.mountainproject.com/user/") && !CURRENT_PAGE.includes("/ticks") &&
         !CURRENT_PAGE.includes("/climb-todo-list") && !CURRENT_PAGE.includes("/contributions") && !CURRENT_PAGE.includes("/community")) {
            var firstSection = $('.section-title').first().parents('.section').first();
            firstSection.append("<p id='loadingUserTick' style='margin-bottom:250px;margin-top:250px;'>Loading Score Card Data ....</p>");
            var tickUrl = CURRENT_PAGE + "/ticks";

            collectRawRouteDataFrom(tickUrl)
                    .then(scores => {
                        // pick response from the second or third promise if first pages of ticks are full
                        if (scores[0].length == 36) {
                            if (scores[1].length == 36) {
                                return scores[2];
                            } else {
                                return scores[1];
                            }
                        }
                        return scores[0];
                    })
                    .then(rawData => generateScore(rawData))
                    .then(function(score) {
                        $('#loadingUserTick').hide();     
                        firstSection.append("<h2>" + 
                            "Score Card Total: " + score.total + "</h2></br>" + generateScoreCardHtml(score));
                        return score;
                    });
        }
    }

    /*  
        ######################################################
        AddScoreCardToUserPage.js END
        ######################################################
    */





    /*  
        ######################################################
        FixStuffIBroke.js START
        ######################################################
    */

    /*
        Fixes notifications dropdown,, the ajax call doesn't work anymore..
    */
    function fixNotificationsDropdown() {
        $("#notification-dropdown.dropdown-toggle").attr("data-toggle","toggleThatShouldNotExist");
        $("#bubble").wrap("<a href='https://www.mountainproject.com/notifications'></a>");
    }

    
    /*
        Fixes dropdowns, I broke them somehow
    */
    function fixDropdowns() {
            $('[data-toggle="dropdown"]').each( function() {
            var thisDropdown = $(this);
            var dropdownMenuHtml = thisDropdown.parents('.dropdown').first().find('.dropdown-menu').html();
            thisDropdown.popover({container: 'body',trigger: 'focus', html: true, placement:"bottom", content: dropdownMenuHtml});
        });
    }

    /*  
        ######################################################
        FixStuffIBroke.js END
        ######################################################
    */




    /*  
        ######################################################
        GenerateScoreCardHtml.js START
        ######################################################
    */

    /*
        @param score - a score entry object containing total score and meta data for top 5 climbs
            (e.g. {total: 40, topFive:[{name: 'Technical Difficulties', grade: '5.12a/b', note: 'Jun 9, 2022  ·  Lead / Onsight. Soft maybe'}]})
        @return scoreCardPopoverHtml - html for the score card popover
    */
    function generateScoreCardHtml(score) {
        var scoreCardPopoverHtml_return = JSON.stringify(score, null, 4);
        
        return "<pre>" + scoreCardPopoverHtml_return + "</pre>";
    }

    /*  
        ######################################################
        GenerateScoreCardHtml.js END
        ######################################################
    */




    /*  
        ######################################################
        CollectRouteData.js START
        ######################################################
    */

    /*
        @param ticksUrl - a url to a user's tick list (e.g. https://www.mountainproject.com/user/107585679/aawait/ticks)
        @return parsedRouteDataCollection - a collection containing the name, grade, and note associated with each climb
            (e.g. [{name: 'Technical Difficulties', grade: '5.12a/b', note: 'Jun 9, 2022  ·  Lead / Onsight. Soft maybe'}])
    */
    function collectRawRouteDataFrom(ticksUrl) {
        var parsedRouteDataCollection_return = [];

        var promise1 = fetch(ticksUrl)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/html"))
            .then(data => {

                var routes = data.querySelectorAll("a.route-row");

                Array.from(routes).forEach(function (route) {
                    var parsedRouteData = {};

                    var routeName = route.querySelector("strong");
                    if (routeName !== null) {
                        parsedRouteData.name = routeName.innerHTML;
                    }
                    var routeGrade = route.querySelector(".rateYDS");
                    if (routeGrade !== null) {
                        var cleanGrade = cleanGradeData(routeGrade.innerHTML);
                        parsedRouteData.grade = cleanGrade;
                    }

                    var routeNote = route.querySelector("i");
                    if (routeNote !== null) {
                        parsedRouteData.note= routeNote.innerHTML;
                    }
                    parsedRouteDataCollection_return.push(parsedRouteData);

                });
                return parsedRouteDataCollection_return
            });
        var promise2 = fetch(ticksUrl+"?page=2")
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/html"))
            .then(data => {

                var routes = data.querySelectorAll("a.route-row");

                Array.from(routes).forEach(function (route) {
                    var parsedRouteData = {};

                    var routeName = route.querySelector("strong");
                    if (routeName !== null) {
                        parsedRouteData.name = routeName.innerHTML;
                    }
                    var routeGrade = route.querySelector(".rateYDS");
                    if (routeGrade !== null) {
                        var cleanGrade = cleanGradeData(routeGrade.innerHTML);
                        parsedRouteData.grade = cleanGrade;
                    }

                    var routeNote = route.querySelector("i");
                    if (routeNote !== null) {
                        parsedRouteData.note= routeNote.innerHTML;
                    }
                    parsedRouteDataCollection_return.push(parsedRouteData);

                });
                return parsedRouteDataCollection_return
            });
        var promise3 = fetch(ticksUrl+"?page=3")
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/html"))
            .then(data => {

                var routes = data.querySelectorAll("a.route-row");

                Array.from(routes).forEach(function (route) {
                    var parsedRouteData = {};

                    var routeName = route.querySelector("strong");
                    if (routeName !== null) {
                        parsedRouteData.name = routeName.innerHTML;
                    }
                    var routeGrade = route.querySelector(".rateYDS");
                    if (routeGrade !== null) {
                        var cleanGrade = cleanGradeData(routeGrade.innerHTML);
                        parsedRouteData.grade = cleanGrade;
                    }

                    var routeNote = route.querySelector("i");
                    if (routeNote !== null) {
                        parsedRouteData.note= routeNote.innerHTML;
                    }
                    parsedRouteDataCollection_return.push(parsedRouteData);

                });
                return parsedRouteDataCollection_return
            });
        return Promise.all([promise1, promise2, promise3]);
    }

    /*
        @param rawGradeData
        @return cleanGradeData - grade data that doesn't include any slash grades (e.g. v4-v5) or grades with plus or minus at the end (e.g. 5.9+)
    */
    function cleanGradeData(rawGradeData) {
        var cleanGradeData_return = rawGradeData;
        if (cleanGradeData_return.indexOf('-') != '-1') {
            // clean up slash grades (ie v4-v5) and grades with a minus (5.12-)
            cleanGradeData_return = cleanGradeData_return.substring(0, cleanGradeData_return.indexOf('-'));
            if (cleanGradeData_return == "V") {
                cleanGradeData_return = "V0";
            }
        }
        if (cleanGradeData_return.indexOf('+') != '-1') {
            // clean up grades with a plus (5.9+)
            cleanGradeData_return = cleanGradeData_return.substring(0, cleanGradeData_return.indexOf('+')); 
        }
        if (cleanGradeData_return.indexOf('/') != '-1') {
            // clean up the other kind of slash grade (v4/v5)
            cleanGradeData_return = cleanGradeData_return.substring(0, cleanGradeData_return.indexOf('/'));
        }

        return cleanGradeData_return;
    }

    /*  
        ######################################################
        CollectRouteData.js END
        ######################################################
    */




    /*  
        ######################################################
        GenerateScore.js START
        ######################################################
    */

    /*
        @param parsedRouteDataCollection - a collection containing the name, grade, and note associated with each climb
            (e.g. [{name: 'Technical Difficulties', grade: '5.12a/b', note: 'Jun 9, 2022  ·  Lead / Onsight. Soft maybe'}])
        @return score - the total score associated with the provided parsedRouteDataCollection

            The score is determined with the following rules:
                - 1pt for trying a route but not sending (regardless of grade)
                - 1pt per V grade for boulders sent
                - 1pt for sent routes 5.1-5.10c
                - 5.10d and up sends follows this fomula:  last number*3 + (a=0,b=0.75,c=1.5,d=2.25)
                - 1 bonus point for flash
                - 1.5 bonus points for onsight
    */
    function generateScore(parsedRouteDataCollection) {
        var score_return = {};
        score_return.topFive = [];
        score_return.total = 0;

        var scoreCollection = [];

        parsedRouteDataCollection.forEach( routeData => {
            var scoreEntry = routeData;
            scoreEntry.score = 0;

            var grade = routeData.grade;

            // if it was a send/flash/redpoint/onsight {
            if (isSend(routeData.note)) {

                // 1 bonus point for flash
                if (routeData.note.includes("Flash")) {
                    scoreEntry.score = scoreEntry.score + 1
                } else if (routeData.note.includes("Onsight")) {
                    // 1.5 bonus point for onsight
                    scoreEntry.score = scoreEntry.score + 1.5;
                }
                if (grade == null) {
                    // do nothing
                }
                else if (grade.includes("V")) {
                    // if its a v grade, chop off the V
                    var boulderScore = parseFloat(grade.substring(1));
                    scoreEntry.score = scoreEntry.score + boulderScore;
                } else if (isRouteClimb510COrEasier(grade)) {
                    // if its 5.1-5.10c, just give one point
                    scoreEntry.score = scoreEntry.score + 1
                } else {
                    // if we know its a route 5.10d or harder
                    scoreEntry.score = scoreEntry.score + generateScoreForFiveTenDOrHarder(grade);
                }
            } else {
                // if just an attempt, only add 1 pt
                scoreEntry.score = scoreEntry.score + 1
            }

            // Don't add sends unless they happened this year
            var currentYear = new Date().getFullYear();
            if (routeData.note != null && routeData.note.includes(currentYear)) {
                scoreCollection.push(scoreEntry);
            }

            
        });

        // sort scoreCollection by scores
        scoreCollection = scoreCollection.sort((a, b) => (a.score < b.score) ? 1 : -1);

        // Loop through first five entries and add them up
        for (var i = 0; i < 5; i++) {
            if (scoreCollection[i] != null) {
                score_return.total = score_return.total + scoreCollection[i].score;
                score_return.topFive.push(scoreCollection[i]);
            } else {
                score_return.total = score_return.total + 0;
            }
        }
        return score_return;
    }

    /*
        @param grade
        @return isRouteClimb510COrEasier
    */
    function isRouteClimb510COrEasier(grade) {
        if (grade.includes("5.")) {
            if (grade.length < 4) {
                // its less than 3 char and has '5.' in it, must be true
                return true
            } else if (grade.includes("5.10")) {
                if (grade.includes("d")) {
                    return false
                } else {
                    return true
                }
            }
        }
        return false; 
    }

    /*
        @param routeNote - Note associated with tick (e.g. 'Jun 9, 2022  ·  Lead / Onsight. Soft maybe')
        @return isSend - boolean whether route was send or attempt,, also takes into account if send was within approx last year or so
    */
    function isSend(routeNote) {
        if (routeNote == null) {
            return false;
        }
       return routeNote.includes("Onsight") || routeNote.includes("Flash") || routeNote.includes("Send") || routeNote.includes("Redpoint");
    }

    /*
        @param fiveTenDOrHarderGrade - string of rope grade 5.10d or harder
        @return score

        5.10d and up follows this fomula for scoring:  last number*3 + (a=0,b=0.75,c=1.5,d=2.25)
                    - e.g. 5.10d = 0*3+2.25 = 2.25
                    - e.g. 5.11a = 1*3+0 = 3
                    - e.g. 5.11d = 1*3+2.25 = 5.25
                    - e.g. 5.12a = 2*3+0 = 6
                    - e.g. 5.12d = 2*3+2.25 = 8.25
                    - e.g. 13a = 9
                    - e.g. 5.14d = 4*3+2.25 = 14.25
    */
    function generateScoreForFiveTenDOrHarder(fiveTenDOrHarderGrade) {
        var gradeWithTrimmedFirstThreeChar = fiveTenDOrHarderGrade.substring(3);
        var timesThreeMulti = gradeWithTrimmedFirstThreeChar.slice(0,1);
        var letter = gradeWithTrimmedFirstThreeChar.slice(0,2).substring(1);
        var letterScore = 0;
        if (letter == 'b') {
            letterScore = 0.75;
        } else if (letter == 'c') {
            letterScore = 1.5;
        } else if (letter == 'd') {
            letterScore = 2.25;
        }
        return timesThreeMulti*3 + letterScore;
    }

    /*  
        ######################################################
        GenerateScore.js END
        ######################################################
    */

})();







