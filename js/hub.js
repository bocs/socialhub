Array.max = function (array) {
    return Math.max.apply(Math, array);
};

Array.min = function (array) {
    return Math.min.apply(Math, array);
};

$(document).ready(function () {


    var fbMessages, currentBrand, currentData,
        fbMessagesAberUS = [], fbMessagesAberInt = [], fbMessagesHollisUS = [], fbMessagesHollisInt = [], fbMessagesTrash = [];

    var fbAudienceRaw;
    data = [];
    data.bars = [];
    data.barsEng = [];
    data.ch = [];

    var weekday = new Array(7);
    weekday[0] = "sun";
    weekday[1] = "mon";
    weekday[2] = "tues";
    weekday[3] = "wed";
    weekday[4] = "thurs";
    weekday[5] = "fri";
    weekday[6] = "sat";

    function getCsvs() {
        var d1 = new $.Deferred();
        var d2 = new $.Deferred();
        Papa.parse('https://s3-us-west-2.amazonaws.com/spredfast-hackweek/csvs/facebook.csv', {
            'download': true,
            'delimiter': ',',
            'header': true,
            dynamicTyping: true,
            complete: function (d) {
                fbMessages = d.data;
                d1.resolve();
            }
        });
        Papa.parse('https://s3-us-west-2.amazonaws.com/spredfast-hackweek/csvs/facebook_audience.csv', {
            'download': true,
            'delimiter': ',',
            'header': true,
            dynamicTyping: true,
            complete: function (d) {
                fbAudienceRaw = d.data;
                d2.resolve();
            }
        });
        $.when(d1,d2).then (function(){
            fillPage();
        })
    }

    getCsvs();


    var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];

    var dayNames = [ "Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat" ];

    Array.max = function (array) {
        return Math.max.apply(Math, array);
    };

    function findMax(obj, idx) {
        var list = [];
        for (var i in obj) {
            if (isNaN(obj[i][idx]) === false && obj[i][idx] !== undefined) {
                list.push(obj[i][idx]);
            }
        }
        if (!list.length)
            return 0;
        return Array.max(list);
    }

    function findMin(obj, idx) {
        var list = [];
        for (var i in obj) {
            if (isNaN(obj[i][idx]) === false && obj[i][idx] !== undefined && obj[i][idx] != '' && obj[i][idx] != null) {
                list.push(obj[i][idx]);
            }
        }
        if (!list.length)
            return 0;

        return Array.min(list);
    }

    function findSum(obj, idx) {
        var sum = 0;
        for (var i in obj) {
            if (isNaN(obj[i][idx]) === false && obj[i][idx] !== undefined && obj[i][idx] != '' && obj[i][idx] != null) {
                sum += (obj[i][idx]);
            }
        }
        return sum;
    }

    function findAvg(obj, idx) {
        var sum = 0;
        var num = 0;
        for (var i in obj) {
            if (isNaN(obj[i][idx]) === false && obj[i][idx] !== undefined && obj[i][idx] != '' && obj[i][idx] != null) {
                sum += (obj[i][idx]);
                num++;
            }
        }
        var val = (sum / num);
        return Math.round(sum / num);
    }

    function setAudience(audience) {
        var startDate = start.value(),
            endDate = end.value();
        data.bars = [];
        var maxAudience = findMax(audience, "Total Audience");
        var minAudience = findMin(audience, "Total Audience");
        for (var i in audience) {
            var d = new Date(audience[i]["Date (Account Fetched)"]);
            if (d > endDate || d < startDate)
                continue;
            //{ value: 7600506, date: new Date("2014/06/22"), day: "sun" },
            data.bars.push({
                value: audience[i]["Total Audience"],
                date: d,
                day: weekday[d.getDay()],
                offsetMax: maxAudience - audience[i]["Total Audience"],
                offsetMin: audience[i]["Total Audience"] - minAudience
            });
        }
        data.bars.maxValue = maxAudience - minAudience;
    }

    function numberWithCommas(x) {
        return kendo.toString(x, 'n0');
    }

    function getPeriodChangeRate(obj, fields) {
        var startDate = start.value(),
            endDate = end.value();

        var previousPeriod = Math.abs(endDate.getTime() - startDate.getTime());
        var prevDate = new Date();
        prevDate.setTime(startDate.getTime() - previousPeriod);
        if (typeof(fields) == "string")
            fields = [fields];

        var sumCurrent = 0, sumPrevious = 0;
        fields.forEach(function (value) {
            for (var i in obj) {
                if (isNaN(obj[i].date) === false && obj[i].date !== undefined && obj[i].date != '' && obj[i].date != null &&
                    obj[i][value] !== undefined) {
                    if (obj[i].date >= startDate && obj[i].date < endDate) {
                        var t = parseInt(obj[i][value], 10);
                        if (t > 0)
                            sumCurrent += t;
                    } else if (obj[i].date >= prevDate && obj[i].date < startDate) {
                        var t = parseInt(obj[i][value], 10);
                        if (t > 0)
                            sumPrevious += t;
                    }
                }
            }
        });
        var change = Math.round(sumCurrent / sumPrevious * 100) - 100;

        return (change > 0 ? '+' : '') + change + '%';
    }

    function getWeekNumber(date) {
        var d = new Date(date);
        d.setHours(0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
    };

    function getPostsPerQuarter(obj) {
        var end = new Date(),
            start = new Date();
        start.setMonth(end.getMonth() - 3);

        var postsNumber = 0;
        for (var i in obj) {
            if (isNaN(obj[i].date) === false && obj[i].date !== undefined && obj[i].date != '' && obj[i].date != null) {
                if (obj[i].date < start || obj[i].date > end)
                    continue;
                postsNumber++;
            }
        }

        return postsNumber;
    }

    function findAvgPostsPerWeek(obj) {
        var group = [];
        for (var i in obj) {
            if (isNaN(obj[i].date) === false && obj[i].date !== undefined && obj[i].date != '' && obj[i].date != null) {
                var weekNumber = getWeekNumber(obj[i].date);
                if (!group[weekNumber]) {
                    group[weekNumber] = 1;
                }
                else {
                    group[weekNumber]++;
                }
            }
        }
        var sum = 0, num = 0;
        group.forEach(function (value) {
            sum += value;
            num++;
        });

        return sum / num;
    }

    function getFacebookData() {
        var startDate = start.value(),
            endDate = end.value();

        data.barsEng = [];
        for (var key in fbMessages) {
            fbMessages[key].date = new Date(fbMessages[key].date);

            if (fbMessages[key].date > endDate || fbMessages[key].date < startDate)
                continue;
            if (!fbMessages[key].datestamp) {
                fbMessages[key].month = monthNames[fbMessages[key]["date"].getMonth()];
                fbMessages[key].day = dayNames[fbMessages[key]["date"].getDay()];
                fbMessages[key].paidImpressions = Math.round(fbMessages[key]["paid_impressions"]);
                fbMessages[key].orgAndVirImpressions = Math.round(fbMessages[key]["organic_impressions"] + fbMessages[key]["viral_impressions"]);
                fbMessages[key].likes = fbMessages[key]["like_stories"];
                fbMessages[key].comments = fbMessages[key]["comment_stories"];
                fbMessages[key].shares = fbMessages[key]["share_stories"];
                fbMessages[key].datestamp = fbMessages[key].date.getTime();
            }

            //{ clicks: 230, likes: 42, comments: 19, shares: 4, date: new Date("2014/06/22"), day: "sun" },
            data.barsEng.push({
                clicks: fbMessages[key].clicks,
                likes: fbMessages[key].likes,
                comments: fbMessages[key].comments,
                shares: fbMessages[key].shares,
                date: fbMessages[key]["date"],
                day: fbMessages[key].day,
                datestamp: fbMessages[key].datestamp,
                engagement: fbMessages[key]["engagement"],
                organic_impressions: fbMessages[key].orgAndVirImpressions,
                paid_impressions: fbMessages[key].paidImpressions,
                engaged_users: fbMessages[key]["engaged_users"],
                reach: fbMessages[key]["reach"],
                engagement_rate: fbMessages[key]["engagement_rate"]

            });


            fbMessages[key].maxValEng = 0;

            fbMessages[key].maxVal = (fbMessages[key].orgAndVirImpressions + fbMessages[key].paidImpressions > fbMessages[key].maxVal) ? fbMessages[key].orgAndVirImpressions + fbMessages[key].paidImpressions : fbMessages[key].maxVal;
            fbMessages[key].maxValEng = (fbMessages[key].clicks + fbMessages[key].likes + fbMessages[key].comments + fbMessages[key].shares > fbMessages[key].maxValEng) ? fbMessages[key].clicks + fbMessages[key].likes + fbMessages[key].comments + fbMessages[key].shares : fbMessages[key].maxValEng;
            fbMessages[key].maxValComm = (fbMessages[key].comments > fbMessages[key].maxValComm) ? fbMessages[key].comments : fbMessages[key].maxValComm;
        }

        //find out what objects weren't included
        for (key in fbMessagesTrash) {
            console.log("This name wasn't correlated to any brand: " + fbMessagesTrash[key]);
        }

        data.enagedMax = numberWithCommas(findMax(data.barsEng, 'engaged_users'));
        data.enagedMin = numberWithCommas(findMin(data.barsEng, 'engaged_users'));
        data.enagedAvg = numberWithCommas(findAvg(data.barsEng, 'engaged_users'));
        currentData = data.barsEng;
    }


    function chooseBrand() {
        currentRegion = $("input[name=region]:checked").val();
        currentBrand = $("input[name=brand]:checked").val();
        if (currentRegion == "U.S." && currentBrand == "brand1") {
            currentData = fbMessagesAberUS;
        }
        else if (currentRegion == "International" && currentBrand == "brand1") {
            currentData = fbMessagesAberInt;
        }
        else if (currentRegion == "U.S." && currentBrand == "brand2") {
            currentData = fbMessagesHollisUS;
        }
        else if (currentRegion == "International" && currentBrand == "brand2") {
            currentData = fbMessagesHollisInt;
        }
        fillPage();
    }

    $("input[name=region]").on("click", chooseBrand);
    $("input[name=brand]").on("click", chooseBrand);


    function fillPage() {
        getFacebookData();
        setAudience(fbAudienceRaw);

        //Our JSON array with sample data
        //var data = [];

        //Example values
        data.engUsersVal = numberWithCommas(findSum(data.barsEng, 'engaged_users'));
        data.baseActivVal = 57;
        data.engRateVal = numberWithCommas(findAvg(data.barsEng, 'enaged_users'));
        data.engAverVal = data.enagedAvg;
        data.brandAVal = 214.786;
        data.brandBVal = 142.005;
        data.brandCVal = 133.209;
        data.brandDVal = 202.301;
        data.brandEVal = 117.837;
        data.brandFVal = 74.786;
        data.brandGVal = 81.019;
        data.ch.engUsersPer = numberWithCommas(findMax(data.barsEng, 'engaged_users') - findMin(data.barsEng, 'engaged_users'));
        data.ch.baseActivPer = '+14%';
        data.ch.engRatePer = data.enagedAvg;
        data.ch.engAverPer = '+25%';
        data.ch.totalGrowth = numberWithCommas(findMax(data.bars, 'value') - findMin(data.bars, 'value'));
        data.ch.totalActiv = data.bars.length;
        data.ch.totalEng = numberWithCommas(findSum(data.barsEng, 'likes') + findSum(data.barsEng, 'clicks') + findSum(data.barsEng, 'likes'));
        data.ch.totalGrowthPer = '79%';
        data.ch.totalGrowthFac = '42,009';
        data.ch.totalGrowthFacPer = '94%';
        data.ch.totalGrowthTwit = '25,718';
        data.ch.totalGrowthTwitPer = '29%';
        data.ch.totalGrowthInst = '11,016';
        data.ch.totalGrowthInstPer = '82%';
        data.ch.totalPosts = '56,086';
        data.ch.totalPostsPer = '57%';
        data.ch.totalPostsFac = '30,404';
        data.ch.totalPostsFacPer = '72%';
        data.ch.totalPostsTwit = '10,378';
        data.ch.totalPostsTwitPer = '29%';
        data.ch.totalPostsInst = '12,356';
        data.ch.totalPostsInstPer = '62%';
        data.ch.totalPoints = '68,212';
        data.ch.totalPointsPer = '77%';
        data.ch.totalPointsFac = '44,009';
        data.ch.totalPointsFacPer = '81%';
        data.ch.totalPointsTwit = '14,093';
        data.ch.totalPointsTwitPer = '40%';
        data.ch.totalPointsInst = '23,001';
        data.ch.totalPointsInstPer = '19%';
        data.ch.listLabelA = 'Spredfast';
        data.ch.listLabelB = 'Summit';
        data.ch.listLabelC = 'SXSW';
        data.ch.listLabelD = 'Facebook';
        data.ch.listLabelE = 'Marketing';
        data.ch.listLabelAc = '1,201';
        data.ch.listLabelBc = '987';
        data.ch.listLabelCc = '981';
        data.ch.listLabelDc = '603';
        data.ch.listLabelEc = '420';
        data.ch.advocatesChange = '+108';
        data.ch.followersP = '14.7';
        data.ch.advocatesP = '32';
        data.ch.impressP = '75';
        data.ch.reachP = '43';
        data.ch.followersChartS = numberWithCommas(findMax(data.bars, 'value') - findMin(data.bars, 'value'));
        data.ch.advocatesChartS = '24%';
        data.ch.impressChartS = getPeriodChangeRate(fbMessages, ['organic_impressions', 'paid_impressions']);
        data.ch.reachChartS = getPeriodChangeRate(fbMessages, 'reach');
        data.ch.followersQuant = numberWithCommas(findMax(data.bars, 'value'));
        data.ch.brandA = 'American Eagle Outfitters';
        data.ch.brandB = 'Gap';
        data.ch.brandC = 'Aeropostale';
        data.ch.brandD = 'Urban Outfitters';
        data.ch.brandE = 'Forever21';
        data.ch.brandF = 'Abercrombie';
        data.ch.brandG = 'Hollister';
        data.ch.smPieGrowth = 11;
        data.ch.smPieGrowthA = '15,897';
        data.ch.smPieGrowthB = '16,856';
        data.ch.smPiePostsA = numberWithCommas(data.barsEng.length);
        data.ch.smPiePostsB = numberWithCommas(fbMessages.length);
        data.ch.smPiePosts = Math.round(data.barsEng.length / fbMessages.length * 100);
        data.ch.smPieEngagement = 69;
        data.ch.smPieEngagementA = '297';
        data.ch.smPieEngagementB = '205';
        data.ch.smPieReach = 53;
        data.ch.smPieReachA = '6,200';
        data.ch.smPieReachB = '12,800';
        data.ch.postsNumber = numberWithCommas(data.barsEng.length);
        data.ch.avgPostsPerWeek = numberWithCommas(findAvgPostsPerWeek(fbMessages));
        data.ch.postsPerQuarter = numberWithCommas(getPostsPerQuarter(fbMessages));

        var changeStatusType = {
            'followersChartS': {'container': 'changeStatusPlus', 'name': 'New Followers'},
            'impressChartS': {'container': 'changeStatusPlusS', 'name': 'Impressions'},
            'reachChartS': {'container': 'changeStatusPlusS', 'name': 'Reach'}
        };
        Object.keys(changeStatusType).forEach(function (name, key) {
            var value = parseInt(data.ch[name]);
            var isSmallChart = changeStatusType[name].container.substr(changeStatusType[name].container.length - 1) == "S" ? '_s' : '';
            var container = $('#' + name).parents('.' + changeStatusType[name].container);
            if (value > 0) {
                var outUp = '<img src="images/arrow_up' + isSmallChart + '.png">' +
                    '<div id="' + name + '"></div>' +
                    '<div class="newFollowText"><i class="fa fa-caret-up"></i> ' + changeStatusType[name].name + '</div>';
                container.html(outUp);
            } else if (value < 0) {
                var outDown = '<div class="newFollowText minusValA"><i class="fa fa-caret-down"></i> ' + changeStatusType[name].name + '</div>' +
                    '<div id="' + name + '" class="minusVal"></div>' +
                    '<img src="images/arrow_down' + isSmallChart + '.png" class="minusValA">';
                container.html(outDown);
            } else {
                var outZero = '<div id="' + name + '"></div>' +
                    '<div class="newFollowText"><i class="fa"></i> ' + changeStatusType[name].name + '</div>';
                container.html(outZero);
            }
        });
        var engUsersVal = $("#engUsersVal").kendoProgressBar({
            min: 0,
            max: currentData.maxValEng,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var baseActivVal = $("#baseActivVal").kendoProgressBar({
            min: 0,
            max: 100,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var engRateVal = $("#engRateVal").kendoProgressBar({
            min: data.enagedMin,
            max: data.enagedMax,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var engAverVal = $("#engAverVal").kendoProgressBar({
            min: 0,
            max: 100,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var brandAVal = $("#brandAVal").kendoProgressBar({
            min: 0,
            max: 400,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var brandBVal = $("#brandBVal").kendoProgressBar({
            min: 0,
            max: 400,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var brandCVal = $("#brandCVal").kendoProgressBar({
            min: 0,
            max: 400,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var brandDVal = $("#brandDVal").kendoProgressBar({
            min: 0,
            max: 400,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var brandEVal = $("#brandEVal").kendoProgressBar({
            min: 0,
            max: 400,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var brandFVal = $("#brandFVal").kendoProgressBar({
            min: 0,
            max: 300,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        var brandGVal = $("#brandGVal").kendoProgressBar({
            min: 0,
            max: 300,
            type: "value",
            animation: {
                duration: 400
            }
        }).data("kendoProgressBar");

        //Set progressbars values
        engUsersVal.value(data.engUsersVal);
        baseActivVal.value(data.baseActivVal);
        engRateVal.value(data.engRateVal);
        engAverVal.value(data.engAverVal);
//    brandAVal.value(data.brandAVal);
//    brandBVal.value(data.brandBVal);
//    brandCVal.value(data.brandCVal);
//    brandDVal.value(data.brandDVal);
//    brandEVal.value(data.brandEVal);
//    brandFVal.value(data.brandFVal);
//    brandGVal.value(data.brandGVal);

        //Insert change values
        for (var val in data.ch) {
            $("#" + val).text(data.ch[val]);
        }

        $(".fa-info-circle, .fa-minus-circle").kendoTooltip({
            width: 120,
            position: "left"
        }).data("kendoTooltip");

        $(".square").kendoTooltip({
            width: 90,
            position: "top"
        }).data("kendoTooltip");

        //Change platform analytics
        $(".square").click(function () {
            $(".square").removeClass("active");
            $(this).addClass("active");
            $("#analyticsName").html($(this).attr("name"));
        });

        var idName, contName;
        //Minimize blocks
        $(".minimizeIt").click(function (e) {
            if ($(e.currentTarget).hasClass("fa-minus-circle")) {
                $(e.currentTarget).removeClass("fa-minus-circle").addClass("fa-plus-circle");
                idName = $(e.currentTarget).attr("value");
                kendo.fx($("#" + idName)).expand("vertical").stop().reverse();
                $(e.currentTarget).data("kendoTooltip").destroy();
                contName = idName.substr(0, idName.length - 9);
                console.log(idName);
                console.log(contName);
                $(e.currentTarget).kendoTooltip({width: 120, position: "left", content: "Expand " + contName + " window" }).data("kendoTooltip");
            }
            else if ($(e.currentTarget).hasClass("fa-plus-circle")) {
                $(e.currentTarget).removeClass("fa-plus-circle").addClass("fa-minus-circle");
                idName = $(e.currentTarget).attr("value");
                kendo.fx($("#" + idName)).expand("vertical").stop().play();
                $(e.currentTarget).data("kendoTooltip").destroy();
                contName = idName.substr(0, idName.length - 9);
                $(e.currentTarget).kendoTooltip({width: 120, position: "left", content: "Collapse " + contName + " window"}).data("kendoTooltip");
            }
        });


        // Minimum/maximum number of visible items
        var MIN_SIZE = 7;
        var MAX_SIZE = 14;

        // Optional sort expression
        // var SORT = { field: "val", dir: "asc" };
        var SORT = {};

        // Minimum distance in px to start dragging
        var DRAG_THR = 50;

        var i, maxVal = 0, maxValE = 0;
        for (i = 0; i < data.bars.length; i++) {
            data.bars[i].left = 1000 - data.bars[i].value;
            data.bars[i].month = monthNames[data.bars[i].date.getMonth()];
            maxVal = (data.bars[i].value > maxVal) ? data.bars[i].value : maxVal;
        }

        for (i = 0; i < data.barsEng.length; i++) {
            data.barsEng[i].average = data.barsEng[i].likes + data.barsEng[i].comments + data.barsEng[i].shares;
            data.barsEng[i].month = monthNames[data.barsEng[i].date.getMonth()];
            maxValE = ((data.barsEng[i].average + data.barsEng[i].clicks) > maxValE) ? (data.barsEng[i].average + data.barsEng[i].clicks) : maxValE;
        }

        function injectionSvg(thisId) {
            insTag = $("#" + thisId).find("svg text").first();
            insTag.html("per post");
            insTag.attr("x", "606").attr("y", "17").attr("style", "font: 10px Trade Gothic Cond;").attr("fill", "#b1b1b1");
//            $("#" + thisId).find("svg text").attr("y", "17");
        }


        // State variables
        var viewStart = 0;
        var viewSize = MIN_SIZE;
        var newStart;

        // Drag handler
        function onDrag(e) {
            var chart = e.sender;
            var ds = chart.dataSource;
            var delta = Math.round(e.originalEvent.x.initialDelta / DRAG_THR);

            if (delta != 0) {
                newStart = Math.max(0, viewStart - delta);
                newStart = Math.min(data.bars.length - viewSize, newStart);
                ds.query({
                    skip: newStart,
                    page: 0,
                    pageSize: viewSize,
                    sort: SORT
                });
            }
            if (e.sender.element[0].id == "engagementChart") {
                injectionSvg(e.sender.element[0].id);
            }
        }

        function onDragEnd() {
            viewStart = newStart;
        }

        // Zoom handler
        function onZoom(e) {
            var chart = e.sender;
            var ds = chart.dataSource;
            viewSize = Math.min(Math.max(viewSize + e.delta, MIN_SIZE), MAX_SIZE);
            ds.query({
                skip: viewStart,
                page: 0,
                pageSize: viewSize,
                sort: SORT
            });

            // Prevent document scrolling
            e.originalEvent.preventDefault();

            if (e.sender.element[0].id == "engagementChart") {
                injectionSvg(e.sender.element[0].id);
            }

        }


        function createNewGrowthChart() {
            var dataSource = new kendo.data.DataSource({
                data: data.bars,
                skip: viewStart,
                page: 0,
                pageSize: viewSize,
                sort: SORT,
                aggregate: [
                    {field: "value", aggregate: "sum"}
                ]
            });

            dataSource.fetch(function () {
            });

            $("#newGrowthChart").height(230).kendoChart({
                dataSource: dataSource,
                categoryAxis: {
                    field: "date",
                    color: '#b1b1b1',
                    line: {
                        visible: false
                    },
                    minorGridLines: {
                        visible: false
                    },
                    majorGridLines: {
                        visible: false
                    },
                    type: "date",
                    baseUnit: "fit",
                    labels: {
                        dateFormats: {
                            days: "M-d"
                        }
                    }
                },
                valueAxis: [
                    {
                        // Optionally set min and max
                        // to avoid axis range changes
                        min: 0,
                        max: data.bars.maxValue + 100,
                        line: {
                            visible: false
                        },
                        minorGridLines: {
                            visible: false
                        },
                        majorGridLines: {
                            visible: false
                        },
                        visible: false

                    }
                ],
                chartArea: {
                    background: ""
                },
                seriesDefaults: {
                    type: "column",
                    stack: {
                        type: "100%"
                    },
                    tooltip: {
                        visible: true,
                        template: "<span class='mid white'>+#= kendo.toString(value, 'n0') # users</span><br><span class='lgreyCol'>#= dataItem.date.getDate() # #= dataItem.month #  #= dataItem.date.getFullYear() # </span>"
                    }
                },
                series: [
                    {
                        overlay: {
                            gradient: "none"
                        },
                        field: "offsetMin",
                        categoryField: "date",
                        color: '#75b6d2',
                        gap: 0.8,
                        stack: true
                    },
                    {
                        field: "left",
                        color: "#5b5b5b",
                        overlay: {
                            gradient: "none"
                        },
                        gap: 0.8,
                        stack: true,
                        tooltip: {
                            visible: false
                        }
                    }
                ],

                transitions: false,
                drag: onDrag,
                dragEnd: onDragEnd,
                zoom: onZoom
            });

        }


        function createEngagementChart() {
            //console.log(currentData.maxValEng);
            $("#engagementChart").height(300).kendoChart({
                dataSource: {
                    data: data.barsEng,
                    skip: viewStart,
                    pageSize: viewSize,
                    page: 0,
                    sort: SORT
                },
                title: {
                    text: ".",
                    color: "#454545"
                },
                legend: {
                    position: "top",
                    labels: {
                        font: "14px Trade Gothic Cond Bold",
                        color: "#b1b1b1",
                        template: "#= series.name #"
                    },
                    margin: {
                        top: -40
                    },
                    offsetX: 10
                },
                series: [
                    {
                        type: "column",
                        field: "clicks",
                        stack: true,
                        name: "Clicks",
                        color: "#75b6d2",
                        overlay: {
                            gradient: "none"
                        },
                        gap: 2
                    },
                    {
                        type: "column",
                        field: "likes",
                        stack: true,
                        name: "Likes",
                        color: "#f26322",
                        overlay: {
                            gradient: "none"
                        }
                    },
                    {
                        type: "column",
                        field: "comments",
                        stack: true,
                        name: "Comments",
                        color: "#b15c27",
                        overlay: {
                            gradient: "none"
                        }
                    },
                    {
                        type: "column",
                        field: "shares",
                        stack: true,
                        name: "Shares",
                        color: "#e4bf21",
                        overlay: {
                            gradient: "none"
                        }
                    },
                    {
                        type: "line",
                        field: "engagement",
                        name: "Average engagements",
                        color: "#b8b6bc",
                        axis: "quantity",
                        overlay: {
                            gradient: "none"
                        },
                        tooltip: {
                            visible: true,
                            template: "<span class='mid black'>#= kendo.toString(value, 'n0') # likes, comments and shares</span><br><span class='lgreyCol'>#= dataItem.date.getDate() # #= dataItem.month #  #= dataItem.date.getFullYear() # </span>"
                        }
                    }
                ],
                valueAxes: [
                    {
                        name: "quantity",
                        min: 0,
                        max: currentData.maxValEng,
                        color: "#b1b1b1",
                        majorGridLines: {
                            visible: false
                        },
                        line: {
                            visible: true,
                            color: "#5b5b5b"
                        }

//                    majorUnit: 250
                    }
                ],
                categoryAxis: {
                    field: "date",
                    type: "date",
                    baseUnit: "day",
                    color: "#b1b1b1",
                    line: {
                        visible: true,
                        color: "#5b5b5b"
                    },
                    majorGridLines: {
                        visible: false
                    }
                },
                chartArea: {
                    background: ""
                },
                tooltip: {
                    visible: true,
                    template: "<span class='mid white'>#= kendo.toString(value, 'n0') # #= series.field #</span><br>#= dataItem.date.getDate() # #= dataItem.month #  #= dataItem.date.getFullYear() #  "
                },
                transitions: true,
                drag: onDrag,
                dragEnd: onDragEnd,
                zoom: onZoom

            });

            injectionSvg("engagementChart");
        }

        function createPaidChart() {
            $("#paidChart").height(300).kendoChart({
                dataSource: {
                    data: data.barsEng,
                    skip: viewStart,
                    page: 0,
                    pageSize: viewSize,
                    sort: SORT
                },
                title: {
                    text: ".",
                    color: "#454545"
                },
                legend: {
                    position: "top",
                    labels: {
                        font: "14px Trade Gothic Cond Bold",
                        color: "#b1b1b1",
                        template: "#= series.name #"
                    },
                    margin: {
                        top: -40
                    },
                    offsetX: 10
                },
                series: [
                    {
                        type: "column",
                        field: "paid_impressions",
                        stack: true,
                        name: "Paid impressions &nbsp; ",
                        color: "#75b6d2",
                        overlay: {
                            gradient: "none"
                        },
                        gap: 2
                    },
                    {
                        type: "column",
                        field: "organic_impressions",
                        stack: true,
                        name: "Organic & viral impressions &nbsp; &nbsp; &nbsp;",
                        color: "#f26322",
                        overlay: {
                            gradient: "none"
                        }
                    },
                    {
                        type: "line",
                        field: "reach",
                        name: "Reach",
                        color: "#b8b6bc",
                        axis: "quantity",
                        overlay: {
                            gradient: "none"
                        },
                        tooltip: {
                            visible: true,
                            template: "<span class='mid black'>#= kendo.toString(value, 'n0') # #= series.name #</span><br>#= dataItem.date.getDate() # #= dataItem.month #  #= dataItem.date.getFullYear() #  "
                        }
                    }
                ],
                valueAxes: [
                    {
                        name: "quantity",
                        min: 0,
                        max: currentData.maxVal,
                        color: "#b1b1b1",
                        majorGridLines: {
                            visible: false
                        },
                        line: {
                            visible: true,
                            color: "#5b5b5b"
                        }

                    }
                ],
                categoryAxis: {
                    field: "date",
                    type: "date",
                    baseUnit: "days",
                    color: "#b1b1b1",
                    line: {
                        visible: true,
                        color: "#5b5b5b"
                    },
                    majorGridLines: {
                        visible: false
                    }
                },
                chartArea: {
                    background: ""
                },
                tooltip: {
                    visible: true,
                    template: "<span class='mid white'>#= kendo.toString(value, 'n0') # #= series.name #</span><br>#= dataItem.date.getDate() # #= dataItem.month #  #= dataItem.date.getFullYear() #  "
                },
                transitions: true,
                drag: onDrag,
                dragEnd: onDragEnd,
                zoom: onZoom

            });

        }

        function createCommentsChart() {
            $("#commentsChart").height(260).kendoChart({
                dataSource: {
                    data: currentData,
                    pageSize: viewSize,
                    page: 0,
                    sort: { field: "date", dir: "day" }
                },
                title: {
                    text: ".",
                    color: "#454545"
                },
                legend: {
                    position: "top",
                    labels: {
                        font: "14px Trade Gothic Cond Bold",
                        color: "#b1b1b1",
                        template: "#= series.name #"
                    },
                    margin: {
                        top: -40
                    },
                    offsetX: 10
                },
                series: [
                    {
                        type: "column",
                        field: "comments",
                        stack: true,
                        name: "Comments",
                        color: "#75b6d2",
                        overlay: {
                            gradient: "none"
                        },
                        gap: 2
                    }
                ],
                valueAxes: [
                    {
                        name: "quantity",
                        min: 0,
                        max: currentData.maxValComm,
                        color: "#b1b1b1",
                        majorGridLines: {
                            visible: false
                        },
                        line: {
                            visible: true,
                            color: "#5b5b5b"
                        }

                    }
                ],
                categoryAxis: {
                    field: "day",
                    color: "#b1b1b1",
                    line: {
                        visible: true,
                        color: "#5b5b5b"
                    },
                    majorGridLines: {
                        visible: false
                    }
                },
                chartArea: {
                    background: ""
                },
                tooltip: {
                    visible: true,
                    template: "<span class='mid white'>#= kendo.toString(value, 'n0') # #= series.name #</span><br><span class='lgreyCol'>#= dataItem.date.getDate() # #= dataItem.month #  #= dataItem.date.getFullYear() # </span>"
                },
                transitions: false,
                drag: onDrag,
                dragEnd: onDragEnd,
                zoom: onZoom

            });

        }


        function createSmallPieChart(id, change) {
            $("#" + id).height(35).width(35).kendoChart({
                legend: {
                    visible: false
                },
                chartArea: {
                    background: ""
                },
                series: [
                    {
                        type: "pie",
                        startAngle: 90,
                        padding: 0,
                        overlay: {
                            gradient: "none"
                        },
                        data: [
                            {
                                category: "full",
                                value: change,
                                color: "#75B6D2"
                            },
                            {
                                category: "empty",
                                value: 100 - change,
                                color: "#585858"
                            }
                        ]
                    }
                ],
                tooltip: {
                    visible: false,
                    format: "{0}%"
                }
            });
        }


        function createLabelsChart() {
            $("#labelsChart").height(260).kendoChart({
                legend: {
                    visible: false
                },
                seriesDefaults: {
                    type: "bubble"
                },
                series: [
                    {
                        minSize: 0,
                        maxSize: 100,
                        data: [
                            {
                                x: 320,
                                y: 150,
                                size: 100,
                                category: "Some label",
                                color: "#ffffff"
                            },
                            {
                                x: 800,
                                y: 180,
                                size: 48,
                                category: "Some label",
                                color: "#8a2319"
                            },
                            {
                                x: 106,
                                y: 138,
                                size: 74,
                                category: "Some label",
                                color: "#0750a2"
                            },
                            {
                                x: 150,
                                y: 190,
                                size: 94,
                                category: "Some label",
                                color: "#00ad4b"
                            },
                            {
                                x: 200,
                                y: 180,
                                size: 160,
                                category: "Some label",
                                color: "#e8a70b"
                            },
                            {
                                x: 280,
                                y: 220,
                                size: 65,
                                category: "Some label",
                                color: "#e8a70b"
                            },
                            {
                                x: 290,
                                y: 87,
                                size: 140,
                                category: "Some label",
                                color: "#00ad4b"
                            },
                            {
                                x: 365,
                                y: 168,
                                size: 100,
                                category: "Some label",
                                color: "#0750a2"
                            },
                            {
                                x: 410,
                                y: 198,
                                size: 81,
                                category: "Some label",
                                color: "#ffffff"
                            },
                            {
                                x: 455,
                                y: 77,
                                size: 30,
                                category: "Some label",
                                color: "#8a2319"
                            },
                            {
                                x: 232,
                                y: 240,
                                size: 77,
                                category: "Some label",
                                color: "#e8a70b"
                            },
                            {
                                x: 250,
                                y: 30,
                                size: 107,
                                category: "Some label",
                                color: "#00ad4b"
                            },
                            {
                                x: 300,
                                y: 180,
                                size: 56,
                                category: "Some label",
                                color: "#0750a2"
                            },
                            {
                                x: 370,
                                y: 108,
                                size: 93,
                                category: "Some label",
                                color: "#ffffff"
                            },
                            {
                                x: 22,
                                y: 77,
                                size: 40,
                                category: "Some label",
                                color: "#8a2319"
                            }
                        ]
                    }
                ],
                xAxis: {
                    min: 0,
                    max: 600,
                    labels: {
                        format: "{0:N0}",
                        skip: 1
                    },
                    majorUnit: 100,
                    color: "#b1b1b1",
                    line: {
                        visible: true,
                        color: "#5b5b5b"
                    },
                    majorGridLines: {
                        visible: false
                    }
                },
                yAxis: {
                    min: 0,
                    max: 300,
                    labels: {
                        format: "{0:N0}"
                    },
                    line: {
                        visible: true,
                        color: "#5b5b5b"
                    },
                    color: "#b1b1b1",
                    majorGridLines: {
                        color: "#5b5b5b"
                    }

                },
                chartArea: {
                    background: ""
                },
                tooltip: {
                    visible: true,
                    color: "#757575",
                    format: "{3}: {2:N0} engaged users",
                    opacity: 1
                }
            });
        }


        function createDonChart(id, name, color) {
            $("#" + id).height(200).width(200).kendoChart({
                title: {
                    text: name
                },
                legend: {
                    visible: false
                },
                seriesDefaults: {
                    labels: {
                        visible: false
                    },
                    holeSize: 66
                },
                series: [
                    {
                        type: "donut",
                        startAngle: 90,
                        padding: 0,
                        overlay: {
                            gradient: "none"
                        },
                        data: [
                            {
                                category: "full",
                                value: 1234456,
                                color: color
                            },
                            {
                                category: "empty",
                                value: 2000000 - 1234456,
                                color: "#d1d1d1"
                            }
                        ]
                    }
                ],
                tooltip: {
                    visible: false,
                    template: "#= category # - #= kendo.format('{0:P}', percentage) #"
                }
            });
        }


        function createAreaChart(id, recData, field, color) {
            $("#" + id).height(100).width(200).kendoChart({
                dataSource: {
                    data: recData,
                    skip: viewStart,
                    page: 0,
                    pageSize: viewSize,
                    sort: SORT
                },
                legend: {
                    visible: false
                },
                seriesDefaults: {
                    type: "area",
                    area: {
                        line: {
                            style: "strict"
                        }
                    }
                },
                series: [
                    {
                        field: field,
                        color: color
                    }
                ],
                valueAxis: {
                    labels: {
                        visible: false,
                        format: "{0}%"
                    },
                    line: {
                        visible: false
                    },
                    majorGridLines: {
                        visible: false
                    },
                    axisCrossingValue: -10
                },
                categoryAxis: {
                    visible: false,
                    field: "date",
                    majorGridLines: {
                        visible: false
                    }
                },
                tooltip: {
                    visible: true,
                    format: "{0}%",
                    template: "#= dataItem.date.getDate() # #= dataItem.month #  #= dataItem.date.getFullYear() #<br> #= series.field # #= kendo.toString(value, 'n0') #"
                }
            });
        }


        createNewGrowthChart();
        createEngagementChart();
        createPaidChart();
        createCommentsChart();
        createLabelsChart();
        createDonChart("donGrowth", "GROWTH", "#75b6d2");
        createDonChart("donActiv", "ACTIVITY", "#e3a4c3");
        createDonChart("donEng", "ENGAGEMENT", "#85c79c");
        createAreaChart("areaGrowth", data.bars, "value", "#75b6d2");
        createAreaChart("areaActiv", data.barsEng, "organic_impressions", "#e3a4c3");
        createAreaChart("areaEng", data.barsEng, "engaged_users", "#85c79c");
        createSmallPieChart("growthSmPie", data.ch.smPieGrowth);
        createSmallPieChart("postsSmPie", data.ch.smPiePosts);
        createSmallPieChart("engagementSmPie", data.ch.smPieEngagement);
        createSmallPieChart("reachSmPie", data.ch.smPieReach);
        $(document).bind("kendo:skinChange", createNewGrowthChart);
        $(document).bind("kendo:skinChange", createEngagementChart);
        $(document).bind("kendo:skinChange", createPaidChart);
        $(document).bind("kendo:skinChange", createCommentsChart);
        $(document).bind("kendo:skinChange", createLabelsChart);
        $(document).bind("kendo:skinChange", createSmallPieChart);
        $(document).bind("kendo:skinChange", createDonChart);
        $(document).bind("kendo:skinChange", createAreaChart);

        $("#donGrowth svg text").attr("y", 134);
        $("#donActiv svg text").attr("y", 134);
        $("#donEng svg text").attr("y", 134);


    }

    function startChange() {
        var startDate = start.value(),
            endDate = end.value();

        if (startDate) {
            startDate = new Date(startDate);
            startDate.setDate(startDate.getDate());
            end.min(startDate);
        } else if (endDate) {
            start.max(new Date(endDate));
        } else {
            endDate = new Date();
            start.max(endDate);
            end.min(endDate);
        }
        fillPage();
    }

    function endChange() {
        var endDate = end.value(),
            startDate = start.value();

        if (endDate) {
            endDate = new Date(endDate);
            endDate.setDate(endDate.getDate());
            start.max(endDate);
        } else if (startDate) {
            end.min(new Date(startDate));
        } else {
            endDate = new Date();
            start.max(endDate);
            end.min(endDate);
        }

        fillPage();
    }


    var start = $("#filterDate").kendoDatePicker({
        value: new Date("October 4, 2014 00:00:00"),
        format: "MM / dd / yy",
        change: startChange
    }).data("kendoDatePicker");

    var end = $("#filterDateTo").kendoDatePicker({
        value: new Date(),
        format: "MM / dd / yy",
        change: endChange
    }).data("kendoDatePicker");

    start.max(end.value());
    end.min(start.value());

    $("#openFilterDate,#filterDate").click(function () {
        start.open();
    });

    $("#filterDateTo").bind("click", function () {
        end.open();
    });


//    $("#selectModG").change(function () {
//            $( "#selectModG option:selected" ).each(function() {
//                $(".selectModI")[0].className = "selectModI";
//                $(".selectModI")[0].className = "fa " + $( this ).val() + " selectModI";
//                $(".selectModI")[1].className = "selectModI";
//                $(".selectModI")[1].className = "fa " + $( this ).val() + " selectModI";
//                $( "#selectModA" ).val( $( this ).val() );
//            });
//        }).change();

    $("#selectModA").change(function () {
        $("#selectModA option:selected").each(function () {
            $(".selectModI")[0].className = "selectModI";
            $(".selectModI")[0].className = "fa " + $(this).val() + " selectModI";
//                $(".selectModI")[1].className = "selectModI";
//                $(".selectModI")[1].className = "fa " + $( this ).val() + " selectModI";
//                $( "#selectModG" ).val( $( this ).val() );
        });
    }).change();


});


$(".menuToggle").click(function (e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
    if ($("#wrapper").hasClass("toggled")) {
        $("#menu-toggle i").removeClass("fa-angle-double-left").addClass("fa-angle-double-right");
        $("#menu-toggle span").text("Expand");
    }
    else {
        $("#menu-toggle i").removeClass("fa-angle-double-right").addClass("fa-angle-double-left");
        $("#menu-toggle span").text("Collapse");
    }
});
