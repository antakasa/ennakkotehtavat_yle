function init() {   

    function cauge(mh_bin, med_bin, tyott_bin) {
            var options = {
                size: 180,
                clipWidth: 180,
                clipHeight: 100,
                ringWidth: 18,
                maxValue: 5,
                transitionMs: 4000,
            };
            var maksuHairioMittari = gauge('[mittari="1"]', options);
            maksuHairioMittari.render();
            var tyottomatMittari = gauge('[mittari="2"]', options);
            tyottomatMittari.render();
            var mediaaniMittari = gauge('[mittari="3"]', options);
            mediaaniMittari.render();

            function updateReadings() {
                maksuHairioMittari.update(mh_bin);
                tyottomatMittari.update(tyott_bin);
                mediaaniMittari.update(med_bin);
            }
            updateReadings();
        }

    function kuntahaku(postinro, kunta) {
        var tyhjennys = $(
            "#power-gauge, #power-gauge2, #power-gauge3, #posti-alue, #maksuhairiot-2016, #maksuhairio_ots, #mediaanitulot, #tyottomat , #tekstit");
        tyhjennys.empty();
        $("#maksuhairio-ots").text("Maksuhäiriöt yli 18-v.");
        $("#mediaanitulot-ots").text("Käytettävissä olevat tulot");
        $("#tyottomat-ots").text("Työttömät/työvoima");
        $.getJSON(
            "https://antakasa.cartodb.com/api/v2/sql?q=SELECT%20*%20FROM%20kunnat_merge%20WHERE%20kunta_nimi%20=%20'" +
            kunta + "'", function(data) {
                var jsonobj = jsonQ(data);
                var name2 = jsonobj.find('nimet');
                var pituus = name2.value().length;
                if (pituus > 20) {
                    pituus = 20;
                }
                for (i = 0; i < pituus; i++) {
                    var rand;
                    if (pituus > 20) {
                        rand = Math.floor(Math.random() * name2.value()
                            .length);
                    } else {
                        rand = i;
                    }
                    if (typeof name2.value()[rand] === "string") {
                        naapuri_nimi = name2.value()[rand];
                        naapuri_mh = parseInt(name2.sibling(
                            'maksuhairiot_2016').value()[
                            rand], 10);
                        $("#tekstit").append(naapuri_nimi +
                            " : <b>" + naapuri_mh +
                            " % </b> | ");
                    }
                }
                var name = jsonobj.find('postinumeroita', function() {
                    return this == postinro;
                });
                $("#posti-alue").text(name.sibling('nimet').value());
                $("#kunta-nimi").text(
                    "Maksuhäiriölukuja paikkakunnalta " + name.sibling(
                        'kunta_nimi').value());
                $("#maksuhairiot-2016").text(parseInt(name.sibling(
                    'maksuhairiot_2016').value(), 10) + " %");
                $("#mediaanitulot").text(name.sibling(
                        'mediaanitulot').value() +
                    " €/v., mediaani, yli 18-v.");
                tyottomat = parseInt(name.sibling('tyottomat_2015')
                    .value() * 100, 10);
                if (tyottomat === 0) {
                    tyottomat = 0;
                } else {
                    $("#tyottomat").text(tyottomat + " %");
                }
                var tt_bin = name.sibling('tyottomat_bins');
                var med_bin = name.sibling('medtulo_bins');
                var mh_bin = name.sibling('maksuhairio_2016_bins');
                console.log(tt_bin.value(), med_bin.value());
                var luvut = [Number(mh_bin.value()), Number(med_bin
                    .value()), Number(tt_bin.value())];
                if (luvut[0] === 0) {
                    tyhjennys.empty();
                    $("#power-gauge, #power-gauge2, #power-gauge3")
                        .text(
                            "Postinumerolla ei rekisteröityjä tietoja tai väkiluku on alle 200."
                        );
                } else {
                    cauge.apply(this, luvut);
                }
            });
    }
        // leaflet map
    var bigmapheight = 650,
        smallmapheight = 300,
        mapbreakwidth = 720,
        highzoom = 10,
        lowzoom = 7,
        initzoom = 8,
        vizjson =
        'https://mediafin.cartodb.com/api/v2/viz/6a800846-5607-11e5-b2d0-0e4fddd5de28/viz.json',
        layerUrl =
        'https://antakasa.cartodb.com/api/v2/viz/d1d639be-3592-11e6-b846-0e674067d321/viz.json';
    var options = {
        legends: false,
        cartodb_logo: false,
    };
    if ($("#map").width() > mapbreakwidth) {
        initzoom = highzoom;
        $("#map").height(bigmapheight);
    } else {
        initzoom = lowzoom;
        $("#map").height(smallmapheight);
    }
    var map = new L.Map('map', {
        center: [60.1, 24.567257],
        zoom: 8
    });
    cartodb.createLayer(map, layerUrl, options).addTo(map).on('done',
        function(layer) {
            var subLayerOptions = {
                sql: "SELECT * FROM kunnat_merge ",
                cartocss: "#kunnat_merge { polygon-opacity: 0.5; line-color: #FFF; line-width: 0.1; line-opacity: 0.5;} #kunnat_merge[maksuhairio_2016_bins=null] { polygon-fill: #fff; } #kunnat_merge[maksuhairio_2016_bins=5] { polygon-fill: #009dbc; } #kunnat_merge[maksuhairio_2016_bins=4] { polygon-fill: #41a7c3; } #kunnat_merge[maksuhairio_2016_bins=3] { polygon-fill: #7cbdd2; } #kunnat_merge[maksuhairio_2016_bins=2] { polygon-fill: #b7d9e5; } #kunnat_merge[maksuhairio_2016_bins=1] { polygon-fill: #e1eff4; }",
                interactivity: ['postinumeroita', 'kunta_nimi']
            };
            layer.setInteraction(true);
            var sublayer = layer.getSubLayer(0);
            sublayer.set(subLayerOptions);
            sublayer.on('featureClick', function(e, latlng, pos, data) {
                kuntahaku(data.postinumeroita, data.kunta_nimi);
            });
            layer.on('error', function(err) {
                cartodb.log.log('error: ' + err);
            });
        }).on('error', function() {
        //log the error
    });
    L.tileLayer(
        'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
        }).addTo(map);
    var sql = cartodb.SQL({
        user: 'antakasa'
    });
    $("#country").autocomplete({
        delay: 0,
        autoFocus: true,
        source: function(request, response) {
            sql.execute(
                "select postinumeroita, nimet, kunta_nimi from kunnat_merge where postinumeroita like '" +
                request.term + "%'").done(function(data) {
                response(data.rows.map(function(r) {
                    return {
                        label: r.postinumeroita +
                            ", " + r.nimet +
                            ", " + r.kunta_nimi,
                        value: r.postinumeroita,
                        kunta: r.kunta_nimi
                    };
                }));
            });
        },
        minLength: 1,
        select: function(event, ui) {
            log(ui.item.value), kuntahaku(ui.item.value, ui.item.kunta);
        }
    });

    

    function log(rajat) {
        var sql = new cartodb.SQL({
            user: 'antakasa'
        });
        sql.getBounds(
            "SELECT * FROM kunnat_merge WHERE postinumeroita LIKE '" +
            rajat + "'").done(function(bounds) {
            map.fitBounds(bounds);
        });
    }
    map.on('resize', function(e) {
        if (e.newSize.x < mapbreakwidth) {
            map.setZoom(lowzoom);
            $("#map").css('height', smallmapheight);
        }
        if (e.newSize.x > mapbreakwidth) {
            map.setZoom(highzoom);
            $("#map").css('height', bigmapheight);
            $("#map").css('height', bigmapheight);
        }
    });
kuntahaku("00520", "Helsinki");
}