/* =============================================================================
   TOOLS
   ========================================================================== */
var tools = (function() {
	var isIE = false;
	var IEVersion = false;
	var isSafari = false;
    var md = new MobileDetect(window.navigator.userAgent);

	/**
	 * Init tools
	 */
	var init = function() {
		bindEvents();

		if (md.mobile())
			$('html').addClass('is-mobile');
	}


	/**
	 * Bind events
	 */
	var bindEvents = function() {
		// Prevent image dragging
		$('body').on('mousedown', 'img', function() { return false; });

		// Fill container
		$('body').on('fill', '.fillcontainer', fillContainer);
	}


	/**
	 * Init custom select
	 */
	var initCustomSelect = function() {
		$('select.custom').each(function() {
			if ($(this).siblings('.select-label').length != 0)
				return;

			var select = $(this);

			if (select.attr('data-selected') && select.find('option[value="'+select.attr('data-selected')+'"]').length == 1) {
				select.find('option[value="'+select.attr('data-selected')+'"]').prop('selected', true);
			}

			var value = select.find('option:selected').html();
			var label = $('<span class="select-label"></span>');
			var inner = $('<span class="label-inner"></span>');

			// Wrap select
			select.wrap('<span class="select-container"></span>');

			// Create label
			inner.html(value);
			inner.appendTo(label);
			label.insertBefore(select);

			// Change label value
			select.on('change update', function() {
				var select = $(this);
				var value = select.find('> option:selected').html();
				var label = select.siblings('.select-label').find('.label-inner');

				label.html(value);
			});
		})
	}


	/**
	 * Fill container
	 */
	var fillContainer = function() {
		var element = $(this);
		var container = element.parent();

		// Get ratio
		var ratio = element.attr('data-ratio');
		if (typeof(ratio) == 'undefined') {
			ratio = element.width()/element.height();
			element.attr('data-ratio', ratio);
		}

		// Fill container
		var newWidth = container.width();
		var newHeight = newWidth/ratio;
		if (newHeight < container.height()) {
			newHeight = container.height();
			newWidth = newHeight*ratio;
		}
		element.css({width: newWidth, height: newHeight});

		// Position element
		element.css({top: (container.height()-newHeight)/2, left: (container.width()-newWidth)/2});
	}


	/**
	 * Check if device is desktop
	 */
	var isDesktop = function() {
		return window.matchMedia("(min-width: 1366px)").matches;
	}

	/**
	 * Check if device is tablet
	 */
	var isTablet = function() {
		return window.matchMedia("(max-width: 1365px) and (min-width: 768px)").matches;
	}

	/**
	 * Check if device is smartphone
	 */
	var isSmartphone = function() {
		return window.matchMedia("(max-width: 767px)").matches;
	}

	/**
	 * Check if device is handheld
	 */
	var isMobile = function() {
		return md.mobile();
	}


	/**
	 * Detect IE
	 */
	var checkIE = function() {
		var rv = -1;
		var ua = null;
		var re = null;
		if (navigator.appName == 'Microsoft Internet Explorer') {
			ua = navigator.userAgent;
			re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
			if (re.exec(ua) != null)
				rv = parseFloat( RegExp.$1 );
		} else if (navigator.appName == 'Netscape') {
			ua = navigator.userAgent;
			re  = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
			if (re.exec(ua) != null)
				rv = parseFloat( RegExp.$1 );
		}

		if (rv === -1) {
			isIE = false;
			return false
		} else {
			isIE = true;

			$('html').addClass('is-ie is-ie-'+rv);

			return rv;
		}
	};


	/**
	 * Check if device is running iOs
	 */
	var checkIOS = function() {
		var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

		return isIOS;
	};


	/**
	 * Detect Safari
	 */
	var checkSafari = function() {
		var isSafari = false;
		if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
			isSafari = true;
			$('html').addClass('is-safari');
		}

		return isSafari;
	};


	/**
	 * Simplified version
	 */
	var simplifiedVersion = function() {
		IEVersion = checkIE();

		if (md.mobile() || (isIE && IEVersion < 10))
			return true;
		else
			return false;
	};


	/**
	 * Public API
	 */
	return {
		init: init,
		isDesktop: isDesktop,
		isTablet: isTablet,
		isSmartphone: isSmartphone,
		isMobile: isMobile,
		isIOS: checkIOS,
		isSafari: checkSafari,
		isIE: checkIE,
		simplifiedVersion: simplifiedVersion,
		initCustomSelect: initCustomSelect
	}
})();



/* =============================================================================
   CONTROLLER: =Site
   ========================================================================== */
var site = (function() {
	// Vars
	var pageSlug = null;
	var page = null;
	var oldPage = null;
    var parentScrollTop = null;
    var scrollTop = 0;
    var previouScrollTop = 0;
    var windowWidth = 0;
    var windowHeight = 0;
    var pageLoaded = false;
    var siteIntro = false;
    var linkClicked = false;


	/**
	 * Init site
	 */
	var init = function() {
		// Show loader
		$('.page-loader').addClass('is-visible is-animated');

		// Intro
		var showIntro = sessionStorage.getItem('showIntro');
		if ( false && (showIntro == 1 || showIntro == null) && $('body').hasClass('home')) {
			siteIntro = true;
		} else {
			$('.site-head').css({'opacity': 1});
		}

		// Tools
		tools.init();

		// Bind events
		bindEvents();

		// Get page controller
		pageSlug = $('.page-container').attr('data-page').toCamel();
		page = window['page'+pageSlug];

		// Init page
		pageInit();

		// Geolocate user
		if (navigator.geolocation)
			geolocateUser(true);

		// Smooth scroll
		if ($('.layout-career-portal').length == 0 && !tools.isMobile() && !tools.isSafari()) {
//			initSmoothScroll();
			requestAnimationFrame(moveSmoothScroll);
		}

		// Parallax
		if (!tools.simplifiedVersion())
			initScrollParallax();
	}


	/**
	 * Geolocate user
	 */
	var geolocateUser = function(checkCache) {
		if (checkCache) {
			// Check if user geolocation is already known
			$.post(
			    WRK.ajax_url,
			    {
			        'action': 'artisan_check_geolocation'
			    },
			    function(response){
			    	if (response == '0') {
			    		// Geolocation is not known, ask it
			    		geolocateUser(false);
			    	} else {
			    		// Geolocation is known, show related information
						response = jQuery.parseJSON(response);

						if (response.office != undefined)
			    			toggleGeolocatedOffice(response.office.ID);
			    	}
			    }
			);
		} else {
			// Ask user position
			navigator.geolocation.getCurrentPosition(function(position) {
				var coord = position.coords;

				// Reverse position from coordinates
				$.post(
				    WRK.ajax_url,
				    {
				        'action': 'artisan_get_geolocation',
				        'lat':  coord.latitude, //39.429039
				        'lon': coord.longitude //-74.732033
				    },
				    function(response) {
			    		// Geolocation is known, show related information
						response = jQuery.parseJSON(response);

						if (response.office != undefined)
			    			toggleGeolocatedOffice(response.office.ID);
				    }
				);
			});
		}
	}


	/**
	 * Toggle geolocated office
	 */
	var toggleGeolocatedOffice = function(id) {
		$('.geolocated-offices').each(function() {
			var datas = $(this).find('.geolocated-office');
			var selectedOffice = datas.filter('[data-id="'+id+'"]');
			if (selectedOffice.length != 1)
				selectedOffice = datas.filter('.default');

			selectedOffice.removeClass('hidden');
			selectedOffice.siblings().addClass('hidden');
		});
	}


	/**
	 * Bind events
	 */
	var bindEvents = function() {
		// Intro
		$(window).on('load', pageIntro);
		$(window).on('beforeunload', beforePageChange);

		// Internal links
		$('body').on('click', 'a', linkHandler);

		// Resize handler
		$(window).on('resize orientationchange', resizeHandler);

		// Scroll reveal
		$('.scroll-reveal').on('reveal', scrollRevealHandler);

		// Scroll handler
		$(window).on('scroll smoothscroll', scrollHandler).trigger('scroll');

		// Nav main toggle
		$('.nav-main .nav-toggle').on('click', navMainToggle);

		// Main link handler
		$('.nav-main .menu > .menu-item-has-children > a').on('click', navMainLinkHandler);

		// Site search toggle
		$('.link-site-search').on('click', siteSearchToggle)
		$('.menu-item-search').on('mouseenter mouseleave', siteSearchToggle)

		// Search form
		$('.form-site-search').on('submit', siteSearch);

		// Toggle item
		$('.link-toggle-item').on('click', sectionListToggle)

		// Toggle content
		$('.link-toggle-content').on('click', contentToggle)

		// Select page
		$('.select-page').on('change', selectPage);
	}


	/**
	 * Resize handler
	 */
	var resizeHandler = function() {
		windowWidth = $(window).width();
		windowHeight = parent.window.innerHeight;

		$(window).trigger('scroll');

		// Global things to do on resize
   		$('.fillcontainer').trigger('fill');

		// Resize scroll container
		resizeContainer();

		if (!tools.simplifiedVersion())
			resizeScrollParallax();
	}


	/**
	 * Resize container
	 */
	var resizeContainer = function() {
		// Selectors
		var container = $('.scroll-container');

		$('body').css({height: container.outerHeight()});
	}


	/**
	 * Scroll handler
	 */
	var scrollHandler = function() {
		if (parentScrollTop != null)
			scrollTop = parentScrollTop;
		else
			scrollTop = $(window).scrollTop();
		var maxScrollTop = $(document).height()-$(window).height();

		previouScrollTop = scrollTop;

		var revealLimit = windowHeight*0.7 + scrollTop;

		if (pageLoaded) {
			// Reveal elements
			$('.scroll-reveal').not('.is-revealed').each(function() {
				var element = $(this);

				if (revealLimit >= element.offset().top)
					element.trigger('reveal');
			});
		}
	}

	/**
	 * Internal link handler
	 */
	var linkHandler = function(e) {
		// Get link href
		var link = $(this);
		var url = link.attr('href');

		// Check if it's an internal URL
		if (url.indexOf(WRK.host) === 0) {
			e.preventDefault();

			if (window.location.href == url)
				return;

			var wait = $('.nav-main').data('wait');
			if (wait)
				return;

			linkClicked = true;

			pageOutro(url);
			// pageLoading(url, true);
		} else if (url.indexOf('#') === 0) {
			scrollToTarget(url);
			e.preventDefault();
		}
	}

	/**
	 * Scroll to target
	 */
	var scrollToTarget = function(url) {
		// Selectors
		var target = $(url);
		if (target.length == 0)
			return;

		var top = target.offset().top - ($(window).height() - target.height())/2 - 100;

		// Scroll
		$('html,body').animate(
			{
				scrollTop: top
			},
			{
				duration: 800,
				easing: 'easeInOutCubic'
			}
		);
	}

	/**
	 * Before page change
	 */
	var beforePageChange = function() {
		if (linkClicked) {
			sessionStorage.setItem('showIntro', 0);
		} else {
			sessionStorage.setItem('showIntro', 1);
		}
	}


	/**
	 * Default page outro
	 */
	var pageOutro = function(url) {
		// Page outro
		if (oldPage != undefined && oldPage.outro != undefined) {
			oldPage.outro();
		} else {
			$('.page-loader').addClass('is-visible');

			TweenMax.to(
				$('html,body'),
				0.3,
				{
					scrollTop: 0,
					ease: Power1.easeInOut
				}
			);

			TweenMax.fromTo(
				$('.page-container'),
				0.3,
				{
					alpha: 1,
					y: 0
				},
				{
					alpha: 0,
					y: -30,
					ease: Power1.easeInOut,
					onComplete: function() {
						window.location = url;
					}
				}
			);
		}
	}


	/**
	 * Default page intro
	 */
	var pageIntro = function() {
		// Selectors
		var loader = $('.page-loader');
		var container = $('.page-container');
		var head = $('.site-head');

		if (siteIntro) {
			var headElements = head.find('.site-title, .menu > .menu-item');

			// Before animation
			loader.removeClass('is-visible');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			if (container.is('[data-page="page"]') || container.is('[data-page="article"]')) {
				tl.fromTo(
					container,
					0.3,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power2.easeOut
					},
					0
				);
			} else {
				tl.fromTo(
					container,
					0,
					{
						alpha: 0
					},
					{
						alpha: 1
					},
					0
				);
			}

			tl.call(function() {
				pageLoaded = true;

				$(window).trigger('resize');
			});

			tl.fromTo(
				head,
				0.5,
				{
					y: -head.height(),
					alpha: 1
				},{
					y: 0,
					alpha: 1,
					ease: Power3.easeOut
				},
				0.15
			);

			tl.staggerFromTo(
				headElements,
				0.5,
				{
					y: 10,
					alpha: 0
				},
				{
					y: 0,
					alpha: 1,
					ease: Power3.easeOut
				},
				0.05,
				0.3
			);

			tl.call(function() {
				loader.removeClass('is-animated');

				container.css({transform: ''});
				head.css({transform: ''});
				headElements.css({transform: ''});
			});

			tl.play();
		} else {
			// Before animation
			head.css({opacity: 1});
			loader.removeClass('is-visible');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			if (container.is('[data-page="page"]') || container.is('[data-page="article"]')) {
				tl.fromTo(
					container,
					0.3,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power2.easeOut
					},
					0
				);
			} else {
				tl.fromTo(
					container,
					0,
					{
						alpha: 0
					},
					{
						alpha: 1
					},
					0
				);
			}

			tl.call(function() {
				pageLoaded = true;

				$(window).trigger('resize');
			});

			tl.call(function() {
				loader.removeClass('is-animated');

				container.css({transform: ''});
			});

			tl.play();
		}
	}


	/**
	 * Init page
	 */
	var pageInit = function() {
		// Global things to do on page init
		$(window).trigger('resize');

		// Load images
		$('img.queue-loading').not('.is-loaded').queueLoading();

		// Custom select
		tools.initCustomSelect();

		// Init slideshow
		slideshow.init();

		// Init lottie animations
		loadLottieAnimations();

		// Specific page init
		if (page != undefined && page.init != undefined)
			page.init();


		pageScrollAnchor();
	}


	/**
	 * Scroll to anchor
	 */
	var pageScrollAnchor = function() {
		var hash = window.location.hash;
			hash = hash.indexOf('#/') === 0 ? '#' + hash.split('#')[2] : hash;
		var target = hash.indexOf('#/') === -1 ? $(hash) : false;

	    if (target && target.length == 1) {
			// Scroll top
			TweenMax.to(
				$('html,body'),
				0.4,
				{
					scrollTop: target.offset().top - $('.site-head').outerHeight(), // - 100,
					ease: Power3.easeInOut
				}
			);
	    }
	}


	/**
	 * Load lottie animations
	 */
	var loadLottieAnimations = function() {
		$('.lottie-container').each(function() {
			var container = $(this);
			var key = container.attr('data-key');
			var anim = container.data('lottieAnim');

			if (typeof(anim) == 'object')
				return;

			if (container.hasClass('lottie-intro')) {
				var anim = bodymovin.loadAnimation({
					container: this,
					renderer: 'svg',
					loop: false,
					autoplay: false,
					path: WRK.tpl_dir+'/anim/'+key+'.json'
				});
				container.data('lottieAnim', anim);

				var containerLoop = container.next('.lottie-loop');
				if (containerLoop.length == 1) {
					containerLoop.hide();
					anim.addEventListener('complete', function() {
						container.hide();
						containerLoop.show();
						anim.goToAndStop(0, true);

						var animLoop = containerLoop.data('lottieAnim');
						animLoop.goToAndPlay(0, true);
					});
				}
			} else if (container.hasClass('lottie-loop')) {
				var autoPlay = false;
				if (container.attr('data-autoplay') == 'true')
					autoPlay = true;

				var anim = bodymovin.loadAnimation({
					container: this,
					renderer: 'svg',
					loop: true,
					autoplay: autoPlay,
					path: WRK.tpl_dir+'/anim/'+key+'.json'
				});
				container.data('lottieAnim', anim);
			}
		});
	}


	/**
	 * Return current page
	 */
	var getPage = function() {
		return page;
	}

	/**
	 * Toggle nav
	 */
	var navMainToggle = function() {
		// Selectors
		var nav = $('.nav-main');
		var container = nav.find('.nav-container');
		var elements = container.find('.menu > .menu-item, .separator');
		var search = container.find('.site-search');

		var wait = nav.data('wait');
		if (wait)
			return;
		nav.data('wait', true);

		if (nav.hasClass('is-opened')) {
			// Before animation
			container.css({display: 'block'});
			nav.removeClass('is-opened');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				container,
				0.6,
				{
					x: 0
				},
				{
					x: -$(window).width(),
					ease: Power3.easeInOut
				},
				0
			);

			tl.call(function() {
				container.css({display: '', transform: ''});

				nav.removeClass('is-opened');
				nav.data('wait', false);
			});

			tl.play();
		} else {
			// Before animation
			nav.addClass('is-opened');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				container,
				0.6,
				{
					x: -$(window).width()
				},
				{
					x: 0,
					ease: Power3.easeInOut
				},
				0
			);

			tl.staggerFromTo(
				elements,
				0.4,
				{
					alpha: 0,
					x: -50
				},
				{
					alpha: 1,
					x: 0,
					ease: Power3.easeOut
				},
				0.05,
				0.3
			);

			tl.call(function() {
				elements.css({opacity: '', transform: ''});
				container.css({transform: ''});
			});

			tl.fromTo(
				search,
				0.3,
				{
					alpha: 0,
					y: search.height()
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				}
			);

			tl.call(function() {
				search.css({opacity: '', transform: ''});

				nav.data('wait', false);
			});

			tl.play();
		}
	}


	/**
	 * Main links handler
	 */
	var navMainLinkHandler = function(e) {
		if (!window.matchMedia("(max-width: 980px)").matches) {
			// e.preventDefault();
			// return false;
		} else {
			var link = $(this);
			var parent = link.parent();

			if (parent.hasClass('menu-item-contact'))
				return true;

			parent.siblings('.menu-item').removeClass('is-opened');
			parent.toggleClass('is-opened');

			e.preventDefault();
			return false;
		}
	}


	/**
	 * Toggle site search
	 */
	var siteSearchToggle = function(e) {
		// Selectors
		var element = $('.links-secondary .menu-item-search');
		clearTimeout(siteSearchToggleTimeout);

		if ((e.type == 'mouseenter' && element.hasClass('is-opened')) || (e.type == 'mouseleave' && !element.hasClass('is-opened')))
			return;

		if (e.type == 'mouseenter') {
			element.addClass('is-opened');
		} else if (e.type == 'mouseleave') {
			siteSearchToggleTimeout = setTimeout(function() {
				element.removeClass('is-opened');
			}, 100);
		} else {
			element.toggleClass('is-opened');
		}

		e.preventDefault();
	}
	var siteSearchToggleTimeout = null;


	/**
	 * Site search
	 */
	var siteSearch = function(e) {
		var type = $('[name="search_type"]:checked').val();
		var text = $('#s').val();

		// if (type == 'jobs') {
			window.location.href = '/jobs/#/jobs?search='+text
		// } else if (type == 'blog') {
			// window.location.href = 'http://creative.artisantalent.com/search-results?q='+text
			// window.location.href = 'http://creative.artisantalent.com/';
		// }

		e.preventDefault();
		return false;
	}


	/**
	 * Toggle list item
	 */
	var sectionListToggle = function(e) {
		// Selector
		var newItem = $(this).closest('.item');
		var activeItem = newItem.siblings('.is-active');
		var container = newItem.closest('.block-list-toggle');
		var lottieContainerIntro = newItem.find('.lottie-intro');
		var lottieContainerLoop = newItem.find('.lottie-loop');

		if (container.data('wait'))
			return;

		// Before animation
		activeItem.find('.body').css({opacity: 1});
		activeItem.removeClass('is-active');
		newItem.addClass('is-active');

		container.data('wait', true);

		// Animation
		var tl = new TimelineLite();
		tl.pause();

		tl.fromTo(
			activeItem.find('.illustration'),
			0.3,
			{
				alpha: 1
			},
			{
				alpha: 0
			},
			0
		);

		tl.fromTo(
			activeItem.find('.text'),
			0.3,
			{
				top: 0,
				alpha: 1
			},
			{
				top: -20,
				alpha: 0,
				ease: Power3.easeIn
			},
			0
		);

		if (lottieContainerIntro.length == 1) {
			tl.call(function() {
				lottieContainerIntro.show();
				lottieContainerLoop.hide();

				var lottieIntro = lottieContainerIntro.data('lottieAnim');
				lottieIntro.goToAndPlay(0, true);
			}, null, null, 0.3);
		} else {
			tl.fromTo(
				newItem.find('.illustration'),
				0.3,
				{
					alpha: 0
				},
				{
					alpha: 1
				},
				0.3
			);
		}

		tl.fromTo(
			newItem.find('.illustration'),
			0.3,
			{
				alpha: 0
			},
			{
				alpha: 1
			},
			0.3
		);

		tl.fromTo(
			newItem.find('.text'),
			0.3,
			{
				top: 20,
				alpha: 0
			},
			{
				top: 0,
				alpha: 1,
				ease: Power3.easeOut
			},
			0.3
		);

		tl.call(function() {
			activeItem.find('.illustration').css({opacity: ''});
			newItem.find('.illustration').css({opacity: ''});
			activeItem.find('.text').css({opacity: '', top: ''});
			newItem.find('.text').css({opacity: '', top: ''});

			activeItem.find('.body').css({opacity: ''});

			container.data('wait', false);
		});

		tl.play();
	}


	/**
	 * Toggle content
	 */
	var contentToggle = function(e) {
		// Selector
		var link = $(this);
		var container = link.closest('.toggle-content');

		if (container.attr('data-toggle') == 'slide') {
			var inner = container.find('.toggle-content-more');

			if (container.hasClass('is-opened')) {
				container.removeClass('is-opened');
			} else {
				// Before animation
				inner.css({height: 'auto'});
				var toHeight = inner.height();
				inner.css({height: ''});

				// Animation
				var tl = new TimelineLite();
				tl.pause();

				tl.to(
					inner,
					0.8,
					{
						height: toHeight,
						marginTop: '1em',
						ease: Power3.easeInOut

					},
					0
				);

				tl.to(
					link,
					0.8,
					{
						height: 0,
						ease: Power3.easeInOut
					},
					0
				);

				tl.call(function() {
					inner.css({height: '', marginTop: ''});
					link.css({height: ''});

					container.addClass('is-opened');
				});

				tl.play();
			}
		} else {
			container.toggleClass('is-opened');
		}

		e.preventDefault();
	}


	/**
	 * Select page
	 */
	var selectPage = function() {
		var dropdown = $(this);
		var link = dropdown.find('option:selected').val();
		if (link && link.indexOf('#') == -1)
			location.href = link;

		if (link.indexOf('#') == 0) {
			var target = $(link);
			var container = target.parent();

			var scrollTop = target.offset().top - $('.site-head').outerHeight() - 50;

			// Scroll
			TweenMax.to(
				$('html,body'),
				0.5,
				{
					scrollTop: scrollTop,
					ease: Power2.easeInOut
				}
			);
		}
	}

	/**
	 * Init smooth scroll
	 */
	var initSmoothScroll = function() {
		$('.scroll-container').addClass('is-active');
	};


	/**
	 * Scroll move
	 */
	var fps = 120;
	if (tools.isIE() !== false)
		fps = 30;
	var now;
	var then = Date.now();
	var interval = 1000/fps;
	var delta;

	var moveSmoothScroll = function() {
     	// Limit FPS
	    now = Date.now();
	    delta = now - then;

	    if (delta > interval) {

			// Selectors
			var container = $('.scroll-container');
			var newY = scrollTop;

			if (container.hasClass('is-active')) {
				// Move container
				var destY = scrollTop;
				var currentY = -getTranslateY(container);

				if (Math.round(currentY) != Math.round(destY)) {
					newY = Math.round(currentY+((destY-currentY)*0.2));

					container.css({transform: 'translate3d(0, -'+newY+'px, 0)'});
					// container.css({top: -newY});
					$(window).trigger('smoothscroll');
				}
			}

			// Move parallax
			var scrollTopMove = newY;

			$('.scroll-parallax').each(function() {
				// Selectors
				var element = $(this);

				var start = Number(element.attr('data-start'));
				var stop = Number(element.attr('data-stop'));
				var movement = Number(element.attr('data-movement'));

				if (scrollTopMove < start) {
					destY = 0.5;
				} else if (scrollTopMove > stop) {
					destY = 1.5;
				} else {
					destY = ((scrollTopMove - start) / (stop - start)) + 0.5;
				}

				destY = movement - movement*destY;

				if (scrollTopMove < start || scrollTopMove > stop) {
					element.css({transform: 'translate3d(0, '+(destY)+'px, 0)'});
					return;
				}

				var currentY = 0;
				var transform = element.css('transform');
				if (transform != 'none')
					currentY = parseFloat(element.css('transform').split(',')[5]);

				var newY = currentY+((destY-currentY)*0.1);

				element.css({transform: 'translate3d(0, '+(newY)+'px, 0)'});
			});

			resizeContainer();

	        then = now - (delta % interval);
	    }

		requestAnimationFrame(moveSmoothScroll);
	}
	var smoothScrollPause = false;


	/**
	 * Init parallax
	 */
	var initScrollParallax = function() {
		var scrollElements = $('.scroll-parallax');
		scrollElements.each(function() {
			var level = $(this).attr('data-level');
			if (level == undefined) {
				level = $(this).css('zIndex');
				if (level == 'auto')
					level = 1;

				if (level > 5)
					level = 5;

				$(this).attr('data-level', level);
			} else if (level == 'rand') {
				level = Math.random();

				$(this).attr('data-level', level);
			}
		});

		resizeScrollParallax();
	};


	/**
	 * Resize parallax
	 */
	var resizeScrollParallax = function() {
		$('.scroll-parallax').each(function() {
			var element = $(this);
			var level = Number(element.attr('data-level'));
			var transform = element.css('transform');
			element.css({transform: ''});

			element.attr('data-movement', element.height()/(5/level));
			element.attr('data-start', element.offset().top-windowHeight);
			element.attr('data-stop', element.offset().top+element.height());

			element.css({transform: transform});
		});
	};


	/**
	 * Scroll reveal animations
	 */
	var scrollRevealHandler = function() {
		var element = $(this);
		if (element.hasClass('is-revealed'))
			return;

		var revealStart = 0;
		if (element.find('.svg-separator').length > 0)
			revealStart = 0.3;

		if (element.hasClass('section-hero')) {

			// Selectors
			var section = element;
			var label = section.find('.scroll-info .label');
			var blocks = section.find('.block');
			var illustration = section.find('.illustration');
			var lottieContainerIntro = illustration.find('.lottie-intro');
			var lottieContainerLoop = illustration.find('.lottie-loop-season');

			if (illustration.hasClass('season-autumn')) {
				// Hide paths
				$('#home-season-path1, #home-season-path2, #home-season-path3').hide();

				// Get paths data
				var motionPath1 = MorphSVGPlugin.pathDataToBezier('#home-season-path1', {align: '#home-season-leaf1'});
				var motionPath2 = MorphSVGPlugin.pathDataToBezier('#home-season-path2', {align: '#home-season-leaf2'});
				var motionPath3 = MorphSVGPlugin.pathDataToBezier('#home-season-path3', {align: '#home-season-leaf3'});

				// Animation
				var tlSvg = new TimelineMax({repeat: 2});
				tlSvg.pause();

				// Leaf 1
				var sartLeaf1 = 0;
				tlSvg.to(
					'#home-season-leaf1',
					5,
					{
						bezier: {
							values: motionPath1,
							type: 'cubic',
							autoRotate: -120,
						},
						ease: CustomEase.create("custom", "M0,0,C0,0,0.173,0.166,0.338,0.42,0.404,0.522,0.554,0.488,0.618,0.574,0.711,0.7,1,1,1,1")
						// repeat: -1
					},
					sartLeaf1
				);
				tlSvg.fromTo(
					'#home-season-leaf1',
					0.3,
					{
						alpha: 0
					},
					{
						alpha: 1,
					},
					sartLeaf1
				);
				tlSvg.fromTo(
					'#home-season-leaf1',
					0.3,
					{
						alpha: 1
					},
					{
						alpha: 0,
						immediateRender: false
					},
					sartLeaf1+4.7
				);

				// Leaf 3
				var sartLeaf3 = 3;
				tlSvg.to(
					'#home-season-leaf3',
					4,
					{
						bezier: {
							values: motionPath3,
							type: 'cubic',
							autoRotate: -120,
						},
						ease: CustomEase.create("custom", "M0,0 C0,0 0.28,0.32 0.384,0.418 0.466,0.496 0.657,0.622 0.74,0.7 0.812,0.768 1,1 1,1")
					},
					sartLeaf3
				);
				tlSvg.fromTo(
					'#home-season-leaf3',
					0.3,
					{
						alpha: 0
					},
					{
						alpha: 1
					},
					sartLeaf3
				);
				tlSvg.fromTo(
					'#home-season-leaf3',
					0.3,
					{
						alpha: 1
					},
					{
						alpha: 0,
						immediateRender: false
					},
					sartLeaf3+3.7
				);

				// Leaf 2
				var sartLeaf2 = 6;
				tlSvg.to(
					'#home-season-leaf2',
					5,
					{
						bezier: {
							values: motionPath2,
							type: 'cubic',
							autoRotate: -120,
						},
						ease: CustomEase.create("custom", "M0,0,C0,0,0.173,0.166,0.338,0.42,0.404,0.522,0.554,0.488,0.618,0.574,0.711,0.7,1,1,1,1")
					},
					6
				);
				tlSvg.fromTo(
					'#home-season-leaf2',
					0.3,
					{
						alpha: 0
					},
					{
						alpha: 1
					},
					sartLeaf2
				);
				tlSvg.fromTo(
					'#home-season-leaf2',
					0.3,
					{
						alpha: 1
					},
					{
						alpha: 0,
						immediateRender: false
					},
					sartLeaf2+4.7
				);
			}

			// Before animation
		    var st1 = new SplitText(element.find('.baseline'), {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleWords = element.find('.section-title').find('.word');
		    titleWords.each(function() {
		    	$(this).attr('data-text', $(this).text());
		    });

		    var baselineWords = element.find('.baseline').find('.word, .separator');
		    baselineWords.each(function() {
		    	$(this).attr('data-text', $(this).text());
		    });

			if (lottieContainerIntro.length >= 1)
				lottieContainerIntro.css({opacity: 0});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			if (lottieContainerIntro.length >= 1) {
				tl.call(function() {
					lottieContainerIntro.each(function() {
						var lottieIntro = $(this).data('lottieAnim');
						lottieIntro.play();

						$(this).css({opacity: ''});
					});
				}, null, null, 0);
			} else {
				tl.fromTo(
					illustration,
					2,
					{
						alpha: 0
					},
					{
						alpha: 1
					},
					revealStart+0.5
				);
			}

			tl.to(
				element.find('.section-title'),
				0.8,
				{
					className: '+=is-visible'
				},
				revealStart+0.5
			);

			tl.staggerTo(
				titleWords,
				1,
				{
					className: '+=is-visible'
				},
				0.05,
				revealStart+0.5
			);

			tl.staggerTo(
				baselineWords,
				0.8,
				{
					className: '+=is-visible'
				},
				0.01,
				revealStart+1
			);

			var blockStart = revealStart+1;
			blocks.each(function() {
				// Selectors
				var block = $(this);
				var outer = block.find('.outer');
				var elements = block.find('.inner > *');

				// Before animation
				var toWidth = block.width();
				outer.css({width: outer.width(), height: outer.height()});

				// Animation
				tl.fromTo(
					block,
					1,
					{
						width: 0
					},
					{
						width: toWidth,
						ease: Power3.easeInOut
					},
					blockStart
				);

				tl.staggerFromTo(
					elements,
					0.5,
					{
						alpha: 0,
						y: 20,
					},
					{
						alpha: 1,
						y: 0,
						ease: Power3.easeOut
					},
					0.1,
					blockStart+0.5
				);

				blockStart += 0.2;
			});

			tl.call(function() {
				if (illustration.hasClass('season-autumn')) {
					tlSvg.play();
				} else if (lottieContainerLoop.length == 1) {
					var lottieLoop = lottieContainerLoop.data('lottieAnim');
					lottieLoop.play();

					lottieContainerLoop.css({opacity: ''});
				}
			}, null, null, 1.5);

			tl.fromTo(
				label,
				0.5,
				{
					alpha: 0,
					y: -30
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.3
			);

			tl.call(function() {
				// st1.revert();

				illustration.css({opacity: ''});
				label.css({trasnform: '', opacity: ''});
				blocks.css({width: ''});
				blocks.find('.outer').css({width: '', height: ''});
				blocks.find('.inner > *').css({transform: '', opacity: ''});

				page.initRotate();
			});

			tl.play();

		} else if (element.hasClass('page-title')) {

			// Selectors
			var title = element;

			// Before animation
		    var st1 = new SplitText(title.find('> small, > span'), {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var subtitleChars = title.find('> small .char');
		    subtitleChars.each(function() {
		    	$(this).attr('data-text', $(this).text());
		    });
		    subtitleChars = subtitleChars.toArray();
		    subtitleChars.sort(function(){return 0.5-Math.random()});

		    var titleChars = title.find('> span .char');
		    titleChars.each(function() {
		    	$(this).attr('data-text', $(this).text());
		    });
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.to(
				title,
				1,
				{
					className: '+=is-visible'
				},
				revealStart+0
			);

			tl.staggerTo(
				subtitleChars,
				0.8,
				{
					className: '+=is-visible'
				},
				0.05,
				revealStart+0
			);

			tl.staggerTo(
				titleChars,
				0.8,
				{
					className: '+=is-visible'
				},
				0.05,
				revealStart+0
			);

			tl.call(function() {
				st1.revert();

				title.css({opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('page-intro')) {

			// Selectors
			var intro = element;
			var background = intro.find('> .background');
			var body = intro.find('.body');
			var address = intro.find('.address');
			var aside = intro.find('.aside');
			var illustration = intro.find('.illustration');

			// Before animation
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				background,
				0.8,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0
			);

			if (body.length == 1) {
				tl.fromTo(
					body,
					0.5,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power3.easeOut
					},
					revealStart+0.6
				);
			} else if (address.length == 1) {
				tl.fromTo(
					address.find('.background'),
					0.8,
					{
						scaleX: 0
					},
					{
						scaleX: 1,
						ease: Power3.easeOut
					},
					revealStart+0.2
				);

				tl.staggerFromTo(
					address.find('.address-inner > *'),
					0.5,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power3.easeOut
					},
					0.1,
					revealStart+0.5
				);
			}

			if (illustration.length == 1) {
				tl.from(
					illustration,
					0.3,
					{
						alpha: 0
					},
					revealStart+0
				);

				tl.fromTo(
					illustration,
					0.8,
					{
						transformPerspective: 400,
						rotationY: -270,
						y: 50
					},
					{
						transformPerspective: 400,
						rotationY: 0,
						y: 0,
						ease: Power3.easeOut
					},
					revealStart+0
				);
			}

			if (aside.hasClass('aside-contact')) {

				var asideBackground = aside.find('> .background');
				var toWidth = windowWidth - aside.offset().left;

				tl.fromTo(
					asideBackground,
					0.8,
					{
						width: 0
					},
					{
						width: toWidth,
						ease: Power3.easeOut
					},
					revealStart+0.4
				);

				tl.staggerFromTo(
					aside.find('.list > *, .btn'),
					0.5,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power3.easeOut
					},
					0.1,
					revealStart+0.7
				);

			} else {
				tl.staggerFromTo(
					aside.add(aside.find('> *')),
					0.5,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power3.easeOut
					},
					0.1,
					revealStart+0.7
				);
			}

			tl.call(function() {
				background.css({transform: ''});

				if (body.length == 1) {
					body.css({transform: '', opacity: ''});
				} else if (address.length == 1) {
					address.find('.background').css({transform: ''});
					address.find('.address-inner > *').css({transform: '', opacity: ''});
				}

				if (aside.hasClass('aside-contact')) {
					aside.find('> .background').css({width: ''});
					aside.find('.list > *').css({transform: '', opacity: ''});
				} else {
					aside.add(aside.find('> *')).css({transform: '', opacity: ''});
				}
			});

			tl.play();

		} else if (element.hasClass('section-page-side-column')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var titleInner = title.find('.title-inner');
			var titleIcon = title.find('.svg');
			var body = section.find('.column-body');
			var bodyInner = body.find('.column-inner');
			var bodyBackground = body.find('.background');
			var lottieContainerIntro = title.find('.lottie-intro');

			// Before animation
		    var st1 = new SplitText(titleInner, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = element.find('.section-title').find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			// tl.fromTo(
			// 	titleInner,
			// 	1,
			// 	{
			// 		x: -30
			// 	},
			// 	{
			// 		x: 0,
			// 		ease: Power3.easeOut
			// 	},
			// 	revealStart+0
			// );

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.02,
				revealStart+0
			);

			if (lottieContainerIntro.length == 1) {
				var lottieIntro = lottieContainerIntro.data('lottieAnim');
				lottieIntro.play();
			} else {
				tl.fromTo(
					titleIcon,
					1,
					{
						alpha: 0,
						x: 30
					},
					{
						alpha: 1,
						x: 0,
						ease: Power3.easeOut
					},
					revealStart+0
				);
			}

			tl.fromTo(
				bodyBackground,
				0.8,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0.1
			);

			if (body.hasClass('column-body-testimonials')) {
				tl.staggerFromTo(
					bodyInner.find('.page'),
					0.3,
					{
						scale: 0
					},
					{
						scale: 1,
						ease: Power3.easeOut
					},
					0.1,
					revealStart+0.8
				);

				tl.fromTo(
					bodyInner,
					0.5,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power3.easeOut
					},
					revealStart+0.6
				);

			} else if (body.hasClass('column-body-awards')) {

				var grid = section.find('.awards-grid');
				grid.css({height: grid.height()});

				var awardStart = revealStart+0.4;
				grid.find('.award').each(function() {
					var award = $(this);
					var mask = award.find('.mask');

					// Animation
					tl.fromTo(
						award,
						0.4,
						{
							scaleY: 0
						},
						{
							scaleY: 1,
							ease: Power2.easeIn
						},
						awardStart
					);

					tl.fromTo(
						mask,
						0.4,
						{
							top: 0,
							bottom: 0
						},
						{
							top: '100%',
							bottom: 0,
							ease: Power2.easeOut
						},
						awardStart+0.4
					);

					awardStart += 0.1;
				});


			}  else {
				tl.staggerFromTo(
					bodyInner.find('> *'),
					0.5,
					{
						alpha: 0,
						y: 20
					},
					{
						alpha: 1,
						y: 0,
						ease: Power3.easeOut
					},
					0.1,
					revealStart+0.6
				);
			}

			tl.call(function() {
				st1.revert();

				bodyBackground.css({transform: ''});
				titleIcon.css({opacity: ''});

				if (body.hasClass('column-body-testimonials')) {
					bodyInner.find('.page').css({transform: ''});
					bodyInner.css({opacity: '', transform: ''});
				} else if (body.hasClass('column-body-awards')) {
					section.find('.awards-grid').css({height: ''});
					section.find('.award').css({transform: ''});
					section.find('.award .mask').css({top: '', bottom: ''});
				} else {
					bodyInner.find('> *').css({opacity: '', transform: ''});
				}
			});

			tl.play();

		} else if (element.hasClass('section-page-hs-form')) {

			// Selectors
			var section = element;
			var background = section.find('.background');
			var elements = section.find('.section-title, .form-container');

			// Before animation
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				background,
				0.8,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0
			);

			tl.staggerFromTo(
				elements,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.6
			);

			tl.call(function() {
				background.css({transform: ''});
				elements.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-page-list')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-text');
			var backgrounds = section.find('.block-list-toggle > .background, .item.is-active .background');
			var titles = section.find('.title');
			var body = section.find('.item.is-active .body').find('.text');
			var lottieContainerIntro = section.find('.item.is-active .lottie-intro');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			if (lottieContainerIntro.length == 1) {
				lottieContainerIntro.css({opacity: 0});
			}

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.05,
				revealStart+0
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.3
			);

			tl.staggerFromTo(
				backgrounds,
				0.8,
				{
					scaleY: 0
				},
				{
					scaleY: 1,
					ease: Power3.easeInOut
				},
				0.1,
				revealStart+0.3
			);

			tl.staggerFromTo(
				titles,
				0.3,
				{
					alpha: 0,
					x: -20
				},
				{
					alpha: 1,
					x: 0,
					ease: Power3.easeOut
				},
				0.05,
				revealStart+0.7
			);

			tl.fromTo(
				body,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.9
			);

			if (lottieContainerIntro.length == 1) {
				tl.call(function() {
					var lottieIntro = lottieContainerIntro.data('lottieAnim');
					lottieIntro.play();

					lottieContainerIntro.css({opacity: ''});
				}, null, null, revealStart+0.9);
			}

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
				backgrounds.css({transform: ''});
				titles.css({transform: '', opacity: ''});
				body.css({transform: '', opacity: ''});
			});

			tl.play();

		}  else if (element.hasClass('section-page-testimonial-video')) {

			// Selectors
			var section = element;
			var background = section.find('.background');
			var elements = section.find('.section-title, .slide.is-active .author');
			var videoContainer = section.find('.video-container');
			var video = videoContainer.find('iframe');
			var pages = section.find('.page');

			// Before animation
			element.addClass('is-revealed');

			videoContainer.css({height: videoContainer.height()});
			video.attr('style', 'width: '+video.width()+'px !important; height: '+video.height()+'px !important;');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				background,
				0.8,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0
			);

			tl.staggerFromTo(
				elements,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.4
			);

			tl.from(
				videoContainer,
				0.8,
				{
					width: 0,
					ease: Power3.easeInOut
				},
				revealStart+0.4
			);

			tl.staggerFromTo(
				pages,
				0.3,
				{
					scale: 0
				},
				{
					scale: 1,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.6
			);

			tl.call(function() {
				background.css({transform: ''});
				elements.css({transform: '', opacity: ''});
				videoContainer.css({width: '', height: ''});
				video.css({width: '', height: ''});
				pages.css({transform: ''});
			});

			tl.play();

		} else if (element.hasClass('section-page-map-offices')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var illustrations = section.find('.map > .svg, .map > .lottie-container');
			var lottieContainers = section.find('.map > .lottie-container');
			var offices = section.find('.office');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = element.find('.section-title').find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.02,
				revealStart+0
			);

			tl.staggerFromTo(
				illustrations,
				1,
				{
					alpha: 0,
					scale: 0.95
				},
				{
					alpha: 1,
					scale: 1,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.2
			);

			tl.call(function() {
				lottieContainers.each(function() {
					var lottieIntro = $(this).data('lottieAnim');
					lottieIntro.play();
				});
			}, null, null, revealStart+0.2);

			tl.staggerFromTo(
				offices,
				0.3,
				{
					alpha: 0,
				},
				{
					alpha: 1
				},
				0.1,
				revealStart+0.6
			);

			tl.call(function() {
				st1.revert();

				illustrations.css({transform: '', opacity: ''});
				offices.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-page-cta')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var elements = section.find('.btn');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = element.find('.section-title').find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.02,
				revealStart+0
			);

			tl.staggerFromTo(
				elements,
				0.5,
				{
					alpha: 0,
					y: 20,
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.5
			);

			tl.call(function() {
				st1.revert();

				elements.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-page-title')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = element.find('.section-title').find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.02,
				revealStart+0
			);

			tl.call(function() {
				st1.revert();
			});

			tl.play();

		} else if (element.hasClass('section-page-staff')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-intro');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.05,
				revealStart+0
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.3
			);

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-page-key-facts')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-header .intro');
			var backgrounds = section.find('.background');
			var facts = section.find('.fact');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				backgrounds,
				0.8,
				{
					scaleY: 0
				},
				{
					scaleY: 1,
					ease: Power3.easeInOut
				},
				0.2,
				revealStart+0
			);

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.05,
				revealStart+0.4
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.7
			);

			tl.staggerFromTo(
				facts,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.8
			);

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
				backgrounds.css({transform: ''});
				facts.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-page-heavy-text')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var backgrounds = section.find('.background');
			var content = section.find('.content > *');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				backgrounds,
				0.8,
				{
					scaleY: 0
				},
				{
					scaleY: 1,
					ease: Power3.easeInOut
				},
				0.2,
				revealStart+0
			);

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.02,
				revealStart+0.4
			);

			tl.staggerFromTo(
				content,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.8
			);

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
				backgrounds.css({transform: ''});
				content.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('member')) {

			// Selectors
			var member = element;
			var image = member.find('.image');
			var elements = member.find('.detail-inner > *');
			var background = member.find('.background');

			// Before animation
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				image,
				0.8,
				{
					alpha: 0,
					x: 50
				},
				{
					alpha: 1,
					x: 0,
					ease: Power3.easeOut
				},
				revealStart+0.2
			);

			tl.fromTo(
				background,
				0.8,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0
			);

			tl.staggerFromTo(
				elements,
				0.5,
				{
					alpha: 0,
					y: 20,
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.6
			);

			tl.call(function() {
				background.css({transform: ''});
				elements.css({transform: '', opacity: ''});
				image.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-jobs')) {

			// Selectors
			var section = element;
			var title = section.find('.title');
			var elements = section.find('.body > *');

			// Before animation
		    var st1 = new SplitText(title.find('strong'), {
		    	type: 'chars',
		    	charsClass: 'char'
		   	});
		   	var chars = title.find('.char');
		   	chars.each(function() {
		   		var char = $(this);
		   		var number = Number(char.text());
		   		var text = '';
		   		for(i = 0; i <= number; i++) {
		   			text += String(i);
		   		}

		   		char.attr('data-text', text);
		   	});

			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();

			tl.fromTo(
				section,
				0.5,
				{
					y: 20,
					alpha: 0
				},
				{
					y: 0,
					alpha: 1,
					ease: Power3.easeOut
				},
				revealStart+0
			);

			tl.staggerTo(
				chars,
				1,
				{
					className: '+=is-visible'
				},
				0.2,
				revealStart+0
			);

			tl.staggerFromTo(
				elements,
				0.5,
				{
					y: 20,
					alpha: 0
				},
				{
					y: 0,
					alpha: 1,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+0.1
			);

			tl.call(function() {
				st1.revert();

				section.css({transform: '', opacity: ''});
				elements.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-foot-cta')) {

			// Selectors
			var section = element;
			var background = section.find('.background');
			var title = section.find('.title');
			var elements = section.find('.body > *');


			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'chars',
		    	charsClass: 'char'
		   	});

		    var chars = title.find('.char');
		    chars = chars.toArray();
		    chars.sort(function(){return 0.5-Math.random()});

			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				background,
				1,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0
			);

			tl.fromTo(
				title,
				0.5,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				revealStart+0.4
			);

			tl.staggerFromTo(
				chars,
				0.5,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.02,
				revealStart+0.4
			);

			tl.staggerFromTo(
				elements,
				0.5,
				{
					alpha: 0,
					y: 10,
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.1,
				revealStart+1
			);

			tl.call(function() {
				st1.revert();

				title.css({opacity: ''});
				background.css({transform: '', opacity: ''});
				elements.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-lp-intro')) {

			// Selectors
			var section = element;
			var mask = section.find('.mask');
			var title = section.find('.section-title');
			var body = section.find('.body');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = element.find('.section-title').find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				mask,
				0.8,
				{
					scaleX: 1
				},
				{
					scaleX: 0,
					ease: Power3.easeInOut
				},
				revealStart+0.2
			);

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.02,
				revealStart+0.6
			);

			tl.fromTo(
				body,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.8
			);

			tl.call(function() {
				st1.revert();

				mask.css({transform: ''});
				body.css({transform: '', opacity: ''});

			});

			tl.play();

		} else if (element.hasClass('section-lp-list-large')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-intro');
			var backgrounds = section.find('.block-list-toggle > .background, .item.is-active .background');
			var titles = section.find('.title');
			var body = section.find('.item.is-active .body').find('.text');
			var lottieContainerIntro = section.find('.item.is-active .lottie-intro');
			var svg = section.find('.item.is-active .svg');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			if (lottieContainerIntro.length == 1) {
				lottieContainerIntro.css({opacity: 0});
			} else {
				svg.css({opacity: 0});
			}

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.05,
				revealStart+0
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 10
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.2
			);

			tl.staggerFromTo(
				backgrounds,
				0.8,
				{
					scaleY: 0
				},
				{
					scaleY: 1,
					ease: Power3.easeInOut
				},
				0.1,
				revealStart+0.3
			);

			tl.staggerFromTo(
				titles,
				0.3,
				{
					alpha: 0,
					x: -20
				},
				{
					alpha: 1,
					x: 0,
					ease: Power3.easeOut
				},
				0.05,
				revealStart+0.7
			);

			tl.fromTo(
				body,
				0.5,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.9
			);

			if (lottieContainerIntro.length == 1) {
				tl.call(function() {
					var lottieIntro = lottieContainerIntro.data('lottieAnim');
					lottieIntro.play();

					lottieContainerIntro.css({opacity: ''});
				}, null, null, revealStart+0.9);
			} else {
				tl.to(
					svg,
					0.5,
					{
						alpha: 1
					},
					revealStart+0.9
				);
			}

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
				backgrounds.css({transform: ''});
				titles.css({transform: '', opacity: ''});
				body.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-lp-dates')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-intro');
			var background = section.find('.background');
			var dates = section.find('.date');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.025,
				revealStart+0
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 10
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.2
			);

			tl.fromTo(
				background,
				0.6,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0.1
			);

			tl.staggerFromTo(
				dates,
				0.3,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.05,
				revealStart+0.5
			);

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
				background.css({transform: ''});
				dates.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-lp-list-small')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-intro');
			var lines = section.find('li');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.025,
				revealStart+0
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 10
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.2
			);

			tl.staggerFromTo(
				lines,
				0.3,
				{
					alpha: 0,
					x: -20
				},
				{
					alpha: 1,
					x: 0,
					ease: Power3.easeOut
				},
				0.03,
				revealStart+0.5
			);

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
				lines.css({transform: '', opacity: ''});
			});

			tl.play();

		}  else if (element.hasClass('section-page-list-light')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-intro');
			var lines = section.find('li');
			var background = section.find('.background');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.025,
				revealStart+0
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 10
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.2
			);

			tl.fromTo(
				background,
				0.6,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0.1
			);

			tl.staggerFromTo(
				lines,
				0.3,
				{
					alpha: 0,
					x: -20
				},
				{
					alpha: 1,
					x: 0,
					ease: Power3.easeOut
				},
				0.03,
				revealStart+0.5
			);

			tl.call(function() {
				st1.revert();

				background.css({transform: ''});
				text.css({transform: '', opacity: ''});
				lines.css({transform: '', opacity: ''});
			});

			tl.play();

		} else if (element.hasClass('section-lp-text')) {

			// Selectors
			var section = element;
			var title = section.find('.section-title');
			var text = section.find('.section-intro');
			var background = section.find('.background');
			var p = section.find('.text p');

			// Before animation
		    var st1 = new SplitText(title, {
		    	type: 'lines,words,chars',
		    	linesClass: 'line',
		    	wordsClass: 'word',
		    	charsClass: 'char'
		   	});

		    var titleChars = title.find('.char');
		    titleChars = titleChars.toArray();
		    titleChars.sort(function(){return 0.5-Math.random()});

			// element.css({opacity: 0});
			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.staggerFromTo(
				titleChars,
				1,
				{
					alpha: 0
				},
				{
					alpha: 1,
					ease: Linear.easeNone
				},
				0.025,
				revealStart+0
			);

			tl.fromTo(
				text,
				0.5,
				{
					alpha: 0,
					y: 10
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0.2
			);

			tl.fromTo(
				background,
				0.8,
				{
					scaleX: 0
				},
				{
					scaleX: 1,
					ease: Power3.easeInOut
				},
				revealStart+0.1
			);

			tl.staggerFromTo(
				p,
				0.3,
				{
					alpha: 0,
					y: 20
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				0.05,
				revealStart+0.5
			);

			tl.call(function() {
				st1.revert();

				text.css({transform: '', opacity: ''});
				background.css({transform: ''});
				p.css({transform: '', opacity: ''});
			});

			tl.play();

		} else {

			// Before animation
			element.css({opacity: 0});

			element.addClass('is-revealed');

			// Animation
			var tl = new TimelineLite();
			tl.pause();

			tl.fromTo(
				element,
				1,
				{
					alpha: 0,
					y: 50
				},
				{
					alpha: 1,
					y: 0,
					ease: Power3.easeOut
				},
				revealStart+0
			);

			tl.call(function() {
				element.css({opacity: '', transform: ''});
			});

			tl.play();

		}
	};


	/**
	 * Public API
	 */
	return {
		init: init,
		getPage: getPage,
		pageIntro: pageIntro
	}
})();



/* =============================================================================
   CONTROLLER: =Home
   ========================================================================== */
var pageHome = (function() {
	var pageSlug = 'home';
	var pageContainer = null;

	/**
	 * Init page
	 */
	var init = function() {
		// Get container
		pageContainer = $('.page-container[data-page="'+pageSlug+'"]').first();
	}


	/**
	 * Init rotate
	 */
	var initRotate = function() {
		var subwords = pageContainer.find('.section-hero .section-title .subword');

	    var st = new SplitText(subwords, {
	    	type: 'chars',
	    	charsClass: 'char'
	   	});

		rotateSubwords()
	}


	/**
	 * Rotate subwords
	 */
	var rotateSubwords = function() {
		// Selectors
		var subwords = pageContainer.find('.section-hero .section-title .subword');
		var container = subwords.first().parent();
		var activeSubword = subwords.filter('.is-visible');
		var nextSubword = activeSubword.next();
		if (nextSubword.length == 0) {
			nextSubword = subwords.eq(0);
		}

		// Before animation
	    var activeChars = activeSubword.find('.char');
	    activeChars = activeChars.toArray();
	    activeChars.sort(function(){return 0.5-Math.random()});

	    var nextChars = nextSubword.find('.char');
	    nextChars = nextChars.toArray();
	    nextChars.sort(function(){return 0.5-Math.random()});

	    nextSubword.css({top: 0});

		// Animation
		var tl = new TimelineLite();
		tl.pause();

		tl.staggerFromTo(
			activeChars,
			0.8,
			{
				top: 0
			},
			{
				top: -activeSubword.height(),
				ease: Power3.easeInOut
			},
			0.05,
			0
		);

		tl.staggerFromTo(
			nextChars,
			0.8,
			{
				top: nextSubword.height()
			},
			{
				top: 0,
				ease: Power3.easeInOut
			},
			0.05,
			0.2
		);


		tl.call(function() {
			nextSubword.css({top: ''});
			$(activeChars).css({top: ''});
			$(nextChars).css({top: ''});

			activeSubword.removeClass('is-visible');
			nextSubword.addClass('is-visible');

			activeSubword.addClass('viewed');
		})

		if (!nextSubword.hasClass('viewed')) {
			tl.call(rotateSubwords, null, null, '+=2');
		}

		tl.play();
	}


	/**
	 * Public API
	 */
	return {
		init: init,
		pageSlug: pageSlug,
		initRotate: initRotate
	}
})();



/* =============================================================================
   CONTROLLER: =Career portal
   ========================================================================== */
var pageCareerPortal = (function() {
	var pageSlug = 'career-portal';
	var searchText = '';

	/**
	 * Init page
	 */
	var init = function() {
		// Search text
		getSearchText();

		// Bind events
		bindEvents();
	}


	/**
	 * Bind events
	 */
	var bindEvents = function() {
		// History event
		$(window).bind('popstate', historyStateChanged);
	}


	/**
	 * Get search text
	 */
	var getSearchText = function() {
		var url = window.location.href;
	    var captured = /search=([^&]+)/.exec(url);
	    searchText = captured ? captured[1] : false;
	    if (searchText) {
			// Scroll top
			TweenMax.to(
				$('html,body'),
				0.4,
				{
					scrollTop: $('.career-portal').offset().top - $('.site-head').height() - 50,
					ease: Power3.easeInOut
				}
			);
	    }

	  	return searchText;
	}


	/**
	 * History state changed
	 */
	var historyStateChanged = function() {
		var previousSearchText = searchText;
		getSearchText();

		if (searchText != false && searchText != previousSearchText) {
			window.location.reload();
		}
	}


	/**
	 * Public API
	 */
	return {
		init: init,
		pageSlug: pageSlug
	}
})();



/* =============================================================================
   WIDGET: =Slideshow
   ========================================================================== */

var slideshow = (function() {
	var slideshowDuration = 4000;

	/**
	 * Init
	 */
	var init = function() {
		var pageContainer = $('.page-container').first();
		var slideshows = pageContainer.find('.slideshow');

		slideshows.each(function() {
			var slideshow = $(this);

			// Swipe handler
			slideshow.swipe({
				swipeLeft:function() {
					nextSlide($(this), false, false);
				},
				swipeRight:function() {
					nextSlide($(this), true, false);
				},
				preventDefaultEvents: !tools.isIOS()
			});

			// Navigation
			slideshow.on('click', '.navigation .arrow', navigationClick);

			// Pagination
			slideshow.on('click', '.pagination .page', paginationClick);

			// Cycle
			if (slideshow.is('[data-auto="true"]')) {
				var timeout = setTimeout(function () {
					nextSlide(slideshow, false, true);
				}, slideshowDuration);
				slideshow.data('timeout', timeout);
			}
		});
	}


    /**
     * Switch slides
     */
    var switchSlides = function(slideshow, index, auto) {
		if (slideshow.data('wait'))
			return;

		// Selectors
		var container = slideshow.find('.slides');
		var slides = slideshow.find('.slide');
		var activeSlide = slides.filter('.is-active');
		var newSlide = slides.eq(index);
		var pages = slideshow.find('.pagination .page');

		if (newSlide.is(activeSlide))
			return;

		// Switch
		if (slideshow.hasClass('slideshow-testimonials-text')) {

			// Before animation
			newSlide.css({opacity: 1});
			slideshow.data('wait', true);

			if (newSlide.index() > activeSlide.index()) {
				var fromY = 50;
				var toY = -50;
			} else {
				var fromY = -50;
				var toY = 50;
			}

			// Animation
			var tl = new TimelineLite();

			tl.to(
				activeSlide,
				0.4,
				{
					top: toY,
					alpha: 0,
					ease: Power3.easeIn
				},
				0
			);

			tl.fromTo(
				newSlide,
				0.4,
				{
					top: fromY,
					alpha: 0
				},
				{
					top: 0,
					alpha: 1,
					ease: Power3.easeOut
				},
				0.3
			);

			tl.call(function() {
				activeSlide.css({opacity: '', top: ''});
				newSlide.css({opacity: '', top: ''});

				newSlide.addClass('is-active');
				activeSlide.removeClass('is-active');
				slideshow.data('wait', false);
			});

			tl.play();

		} else if (slideshow.hasClass('slideshow-testimonials-video')) {

			// Before animation
			newSlide.css({opacity: 1});
			slideshow.data('wait', true);

			if (newSlide.index() > activeSlide.index()) {
				var fromX = newSlide.width();
				var toX = -newSlide.width();
			} else {
				var fromX = -newSlide.width();
				var toX = newSlide.width();
			}

			// Animation
			var tl = new TimelineLite();

			tl.fromTo(
				activeSlide.find('.author'),
				0.3,
				{
					y: 0,
					alpha: 1
				},
				{
					y: 10,
					alpha: 0,
					ease: Power3.easeIn
				},
				0
			);

			tl.fromTo(
				newSlide.find('.author'),
				0.3,
				{
					y: 10,
					alpha: 0
				},
				{
					y: 0,
					alpha: 1,
					ease: Power3.easeOut
				},
				0.3
			);

			tl.fromTo(
				activeSlide.find('.video-container'),
				0.8,
				{
					x: 0
				},
				{
					x: toX,
					ease: Power3.easeInOut
				},
				0
			);

			tl.fromTo(
				newSlide.find('.video-container'),
				0.8,
				{
					x: fromX
				},
				{
					x: 0,
					ease: Power3.easeInOut
				},
				0
			);

			tl.call(function() {
				activeSlide.find('.author, .video-container').css({opacity: '', transform: ''});
				newSlide.find('.author, .video-container').css({opacity: '', transform: ''});
				newSlide.css({opacity: ''});

				newSlide.addClass('is-active');
				activeSlide.removeClass('is-active');
				slideshow.data('wait', false);
			});

			tl.play();

		} else {

			newSlide.addClass('is-active');
			activeSlide.removeClass('is-active');
			slideshow.data('wait', false);

		}

		pages.removeClass('is-active');
		pages.eq(newSlide.index()).addClass('is-active');

		if (auto) {
			timeout = setTimeout(function () {
				switchSlides(slideshow, false, true);
			}, slideshowDuration);
			slideshow.data('timeout', timeout);
		}
	}


	/**
	 * Move to next slide
	 */
	var nextSlide = function(slideshow, previous, auto) {
		// Selectors
		var slides = slideshow.find('.slide');
		var activeSlide = slides.filter('.is-active');
		var newSlide = null;

		if (previous) {
			newSlide = activeSlide.prev('.slide');

			if (newSlide.length == 0)
				newSlide = slides.last();
		} else {
			newSlide = activeSlide.next('.slide');

			if (newSlide.length == 0)
				newSlide = slides.filter('.slide').first();
		}

		switchSlides(slideshow, newSlide.index(), auto);
	}


	/**
	 * Navigation click callback
	 */
	var navigationClick = function() {
		nextSlide($(this).closest('.slideshow'), $(this).hasClass('prev'));
	}


	/**
	 * Pagination click callback
	 */
	var paginationClick = function() {
		var page = $(this);
		var slideshow = page.closest('.slideshow');

		switchSlides(slideshow, page.index(), false);
	}


	/**
	 * Public API
	 */
	return {
		init: init
	}
})();


// Launch site
site.init();

// History back fix
$(window).bind("pageshow", function(event) {
    if (event.originalEvent.persisted) {
        window.location.reload()
    }
});
$(window).on('unload', function () { });
window.onunload = function(){};

var nav = navigator.userAgent;
if (nav.match(/iPhone/g)) {
	document.body.className += ' iphone';
}

