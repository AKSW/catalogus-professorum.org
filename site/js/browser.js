/*
List Professors with simple navigation and search
*/
(function( $ ) {
	function Browser( elem ) {
		this.$elem = $(elem);
		this.browserClass = null;
		this.offset = 0;
		this.limit = 10;
		this.list = [];
		return this;
	}

	Browser.prototype = {
		init : function() {
			var _this = this;
			_this.printClassNavigation();
			_this.printBrowser();
			_this.$elem.find(".panel-footer").addClass("loading");
			_this.fetch(function(list) {
				_this.list = list;
				_this.printPage(_this.list);
				_this.$elem.find(".panel-footer").removeClass("loading");

				if ( $(".search-field").attr("data-value") != "" ) {
					_this.$elem.find(".browser-search").val( $(".search-field").attr("data-value") ).trigger("keyup");
				} 
			});
		},

		printClassNavigation : function() {
			var _this = this;
			var navElements = {
				"Professoren & Personen" : ["http://catalogus-professorum.org/cpm/Person", "http://catalogus-professorum.org/cpm/Professor"],
				"Körperschaften" : [ "http://catalogus-professorum.org/cpm/Body", "http://catalogus-professorum.org/cpm/Institution", "http://catalogus-professorum.org/cpm/Institute", "http://catalogus-professorum.org/cpm/Academy", "http://catalogus-professorum.org/cpm/Department", "http://catalogus-professorum.org/cpm/Faculty" ],
				"Orte" : "http://ns.aksw.org/spatialHierarchy/City"
			};
			var navContainer = $('<ul class="browser-class-nav nav nav-tabs"></ul>');
			$.each(navElements, function(label,uri) {
				var element = $( '<li><a href="#" data-uri="'+uri+'">'+label+'</a></li>' );
				if ( uri == ( _this.browserClass.join() ) ) {
					$(element).addClass("active");
				}
				$(navContainer).append( element );
			});
			_this.$elem.append( navContainer );

			$(navContainer).find("a").click(function() {
				$(".proflist").html("");
				$(".proflist").Browser($(this).attr("data-uri").split(","));
				return false;
			});
		},

		printBrowser : function() {
			var _this = this;
			var browser = $( '<div class="browser panel panel-default"></div>' );
			var searchField = $('<input type="search" class="form-control browser-search" style="width:30%" placeholder="Suche ...">');
			$(browser).append( $('<div class="panel-heading"></div>').append(searchField) );
			$(browser).append('<ul class="browser-list list-group"></ul>');
			$(browser).append( $('<div class="panel-footer"></div>').append('<div class="browser-nav btn-group"></div><div class="browser-counter pull-right"></p>') );

			_this.$elem.append( browser );
			
			searchField.keyup(function() {
				var filtered = _this.filter( $(this).val() );
				_this.offset = 0;
				_this.printPage(filtered);
				
			});			
		},
		printPage : function(list) {
			var _this = this;
			var $list = _this.$elem.find(".browser-list").html("");
			var $nav = _this.$elem.find(".browser-nav").html("");
			var $counter = _this.$elem.find(".browser-counter").html("");
			
			for (var i = _this.offset; i < list.length; i++) {
				if (i >= (_this.offset + _this.limit) ) { break; }
				var label = (typeof list[i].label.value !== undefined) ? list[i].label.value : list[i].resourceUri.value.split("/").reverse()[0];
				$list.append('<li class="browser-entry list-group-item"><a href="'+list[i].resourceUri.value+'">'+label+'</a></li>');
			};

			if ( list.length == 0 ) {
				$list.append('<li class="browser-entry list-group-item">Kein entsprechender Eintrag gefunden.</li>');	
			}

			var prevBtn = $('<button type="button" class="btn btn-default btn-sm"><span class="glyphicon glyphicon-arrow-left"></span> zurück</button> ');
			var nextBtn = $('<button type="button" class="btn btn-default btn-sm">weiter <span class="glyphicon glyphicon-arrow-right"></span></button>');

			if ( _this.offset > 0 && list.length > _this.limit ) {
				$nav.append(prevBtn);
			}
			if ( list.length > ( _this.offset + _this.limit ) ) {
				$nav.append(nextBtn);
			}

			$counter.text("gesamt: " + list.length);

			nextBtn.click(function() {
				_this.offset = _this.offset + _this.limit;
				_this.printPage(_this.list);
				return false;
			});
			prevBtn.click(function() {
				_this.offset = _this.offset - _this.limit;
				_this.printPage(_this.list);
				return false;
			});			
		},

		filter : function(search) {
			var _this = this;
			var search = new RegExp( search, "gi");
			return $.grep(_this.list, function(item) {
				var label = (typeof item.label.value !== undefined) ? item.label.value : item.resourceUri.value;
				return ( label.search(search) !== -1 )
			} );
		},

		fetch : function(callback) {
			var _this = this;
			var filter = "?body = <" + _this.browserClass + ">";
			if ( typeof _this.browserClass !== "string" ) {
				filter = "?body = <" + _this.browserClass.join("> || ?body = <") + ">";
			}

			$.ajax({
				url: urlBase + "sparql",
				dataType: "json",
				data: {
					/*
					query: "SELECT DISTINCT * WHERE { { ?class rdfs:subClassOf <"+_this.browserClass+"> . ?instance rdf:type ?class . } UNION { ?instance rdf:type <"+_this.browserClass+"> ; rdf:type ?class } OPTIONAL { ?instance rdfs:label ?label } } ORDER BY ?label ?instance",
					*/
					query: "SELECT DISTINCT * WHERE { ?resourceUri rdf:type ?body . OPTIONAL { ?resourceUri rdfs:label ?label . } FILTER ( "+filter+" ) } ORDER BY ?label ?resourceUri",
					format: "json"
				},
				success: function( data ) {
					callback(data.results.bindings);
				},
				error: function(e) {
					console.log( 'Error on autocomplete: ', e );
					callback([]);
				},
			});
		}
	};

	
	$.fn.Browser = function( browserClass ) {
		return this.each(function() {
			var browser = new Browser( this );
			browser.browserClass = browserClass;
			browser.init();
		});		
	};
})(jQuery);