(function () {
	"use strict";

	//Router
	var Router = function () { },
		urlHistory = '',
		carousel, menu;

	Router.prototype = {
		urlChangeHandler: function () {
			var self = this,
				arr = location.href.split("/"),
				dir = arr[arr.length - 1];
			if (urlHistory === '') {
				if (dir !== '') {
					urlHistory = dir;
					self.enter();
				}
			} else {
				if (dir === '') {
					location.reload();
					/*urlHistory = dir;
					self.leave();*/
				}
			}
		},

		enter: function () {
			var arr = location.href.split("/"),
				dir = arr[arr.length - 1],
				lang = (dir === 'ja') ? 'ja' : 'en';
			$('header').fadeOut(1000, function () {
				$('main').fadeIn(3000, 'swing');
				$.getJSON('js/works.json', function (data) {
					carousel = new Carousel(data);
					menu = new Menu(data, lang);
				});
			});
		}/*,
		
		leave: function(){
			$('main').fadeOut(1000, function(){
				carousel.terminate();
				carousel = null;
				menu.terminate();
				menu = null;
				$('header').fadeIn(1000, 'swing');
			});
		}*/
	};

	var router = new Router();
	var myHandler = router.urlChangeHandler.bind(router);
	$(window)
		.on('popstate', myHandler);
	$(document).on('click', '#entrance a', function (e) {
		e.preventDefault();
		var href = $(this).attr('href');
		history.pushState(null, null, href);
		myHandler();
	});

	//Carousel
	var Carousel = function (data) {
		this.initialize(data);
	};

	Carousel.prototype = {
		initialize: function (data) {
			this.$gallery = $('#gallery');
			this.$inner = $('#carousel ul');
			this.$activeImg = $('#carousel li:nth-child(7)');
			this.activeIndex = 6;
			this.timmerID = null;
			this.cycle = 500;
			this.isPlay = false;
			this.template = _.template($('#carousel-template').html());
			this.data = data;
			this.theme = location.hash.slice(1) || 'all';
			data = this.filter(this.theme, data);
			this.render(data);
			this.handleEvents();
		},

		filter: function (theme, data) {
			if (theme === 'all') {
				return data;
			} else {
				return data.filter(function (e) {
					return e.theme === theme;
				});
			}
		},

		render: function (data) {
			var html = this.template({
				data: data
			});
			this.$inner.html(html);
			this.replace();
			this.change();
			this.play();
		},

		replace: function () {
			var len = this.$inner.find('li').length,
				size = len - this.activeIndex - 1;
			this.$inner.find('li:gt(' + size + ')').prependTo('#carousel ul');
		},

		play: function () {
			var self = this;
			if (!this.isPlay) {
				this.isPlay = true;
				this.$gallery.css('cursor', 'pointer');
				$('#gallery:hover').css('opacity', '');
			}
			clearInterval(this.timmerID);
			this.timmerID = setInterval(function () {
				self.move(1);
			}, this.cycle * 10);
		},

		pause: function () {
			clearInterval(this.timmerID);
			this.isPlay = false;
			this.$gallery.css('cursor', '');
			$('#gallery:hover').animate({ 'opacity': 1 }, 'slow');
		},

		move: function (size) {
			if (size < 0) {
				for (var i = 0; i > size; i--) {
					this.$inner.find('li:last').prependTo(this.$inner);
				}
			} else if (size > 0) {
				for (var i = 0; i < size; i++) {
					this.$inner.find('li:first').appendTo(this.$inner);
				}
			}
			this.$inner
				.css({ 'marginTop': (this.activeIndex - size * 2) * (-45) + 'px' })
				.animate({ 'marginTop': this.activeIndex * (-45) + 'px' }, this.cycle * 2, 'swing', this.change());
		},

		change: function () {
			var url = this.$inner.find('li:eq(' + this.activeIndex + ') a').attr('href');
			this.$gallery
				.prepend($('<div>').css({ 'backgroundImage': 'url(' + url + ')' }))
				.find('div:gt(0)').fadeOut(this.cycle * 3, function () {
					$(this).remove();
				});
		},

		handleEvents: function () {
			var self = this;

			this.$gallery
				.on('mouseover', function () {
					if (self.isPlay) {
						$(this).css('opacity', 0.7);
					}
				})
				.on('mouseout', function () {
					if (self.isPlay) {
						$(this).css('opacity', '');
					}
				})
				.on('click', function () {
					if (self.isPlay) {
						self.pause();
					}
				});

			this.$inner.on('click', 'a', function () {
				if (!self.$gallery.find('div').is(':animated') && !self.$inner.is(':animated')) {
					self.pause();
					var i = self.$inner.find('a').index(this);
					self.move(i - self.activeIndex);
				}
				return false;
			});

			$(window).on('hashchange', function () {
				self.urlChangeHandler();
			});
		},

		urlChangeHandler: function () {
			clearInterval(this.timmerID);
			this.isPlay = false;
			if ($('#slidebar').hasClass('active')) {
				menu.slidemenu.hideBar();
			}
			this.theme = location.hash.slice(1) || 'all';
			this.render(this.filter(this.theme, this.data));
		},

		terminate: function () {
			this.$inner.empty();
		}
	};

	//Menu
	var Menu = function (data, lang) {
		if (lang !== 'ja') {
			lang = 'en';
		}
		this.initialize(data, lang);
	};

	Menu.prototype = {
		initialize: function (data, lang) {
			this.template = (lang === 'ja') ? _.template($('#mainmenu-template-ja').html()) : _.template($('#mainmenu-template-en').html());
			this.render(data);
			this.slidemenu = new Slidemenu();
		},

		render: function (data) {
			var html = this.template({
				data: data
			});
			$('nav .mainmenu').append(html);
		},

		terminate: function () {
			this.slidemenu.terminate();
			$('nav .mainmenu').empty();
		}
	};

	//Slide Menu
	var Slidemenu = function () {
		this.initialize();
	};

	Slidemenu.prototype = {
		initialize: function () {
			this.insert();
			this.$open = $('#slidebar-open');
			this.$overlay = $('#slidebar-overlay');
			this.$bar = $('#slidebar');
			this.$menu = $('#slidemenu');
			this.$close = $('#slidebar-close');
			this.handleEvents();
		},

		insert: function () {
			$('nav .mainmenu').clone().appendTo('#slidemenu');
			$('nav .submenu').clone().appendTo('#slidemenu');
		},

		handleEvents: function () {
			var self = this;

			this.$open.on('click', function () {
				self.showBar();
				return false;
			});

			this.$overlay.on('click', function () {
				self.hideBar();
				return false;
			});

			this.$close.on('click', function () {
				self.hideBar();
				return false;
			});
		},

		showBar: function () {
			var self = this;
			this.$overlay.addClass('active');
			animEnd(
				this.$bar.addClass('active')
			).then(function () {
				self.$menu.addClass('active');
			});
		},

		hideBar: function () {
			var self = this;
			animEnd(
				this.$menu.removeClass('active')
			).then(function () {
				self.$bar.removeClass('active');
				self.$overlay.removeClass('active');
			});
		},

		terminate: function () {
			this.$menu.find('.mainmenu').remove();
			this.$menu.find('.submenu').remove();
		}
	};

	function animEnd($el) {
		var dfd = new $.Deferred(),
			callback = function () { dfd.resolve($el); };
		if ($el.length === 0 || $el.css('transition') === undefined) {
			dfd.resolve();
			return dfd;
		}
		$el.on('transitionend', callback);
		dfd.done(function () {
			$el.off('transitionend', callback);
		});
		return dfd;
	}

	//About
	$(document).on('click', '.about', function () {
		$('#about').fadeIn('slow');
		carousel.pause();
		menu.slidemenu.hideBar();
		return false;
	});
	$(document).on('click', '#about-back', function () {
		$('#about').fadeOut('slow');
		carousel.play();
		return false;
	});
	$(document).on('click', '#about-overlay', function () {
		$('#about').fadeOut('slow');
		carousel.play();
		return false;
	});

})();