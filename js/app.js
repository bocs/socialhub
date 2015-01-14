var App = {

    init: function (object) {
        var self = object;

        this.backgroundColor(self);
        this.backgroundImage(self);
        this.fontSizeCustomerName(self);
        this.customerName(self);
        this.customerNameColor(self);
    },

    backgroundColor: function (object) {
        var color = object.backgroundColor;
        $("body").css("background-color", color);
    },

    backgroundImage: function (object) {
        var image = object.backgroundImage;
        $("body").css("background-image", "url(images/"+image+")");
    },

    fontSizeCustomerName: function (object) {
        var fontsize = object.fontSizeCustomerName;
        $(".logoRow").css("font-size", fontsize);
    },

    customerName: function (object) {
        var customerName = object.customerName;
        $(".logoRow").text(customerName);
    },

    customerNameColor: function (object) {
        var customerNameColor = object.customerNameColor;
        $(".logoRow").css("color", customerNameColor);
    }

};

App.init(config);