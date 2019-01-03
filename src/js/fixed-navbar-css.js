/**
 * File fixed-navbar-css.js.
 *
 * Add CSS to prevent overlap with other elements when using fixed navbar.
 */
jQuery(document).ready(function($){

		var body = $( 'body' ), navbar = $( '#primary-navbar' ), adminbar = $( '#wpadminbar' ),
			skipLink = $( '.skip-link' ), content = $( '#content' ),
			viewportWidth, width, scrollPos, navbarHeight,adminbarHeight, navbarTop, hasFixedTop,
			padding, top, offset;

		function getPadding() {
			padding = 0;
			if ( viewportWidth > 600 ) {
				padding = navbarHeight;
			}
		}

		function getTop() {
			top = 0;
			if ( viewportWidth > 600 ) {
				top = adminbarHeight;
			}
		}

		function adjustFixedTop() {

			hasFixedTop = navbar.hasClass( 'fixed-top' );

			if ( viewportWidth > 600 ) {
				if ( ! hasFixedTop ) {
					navbar.addClass( 'fixed-top' );
				}
			} else {
				scrollPos = $(window).scrollTop();

				if ( hasFixedTop ) {
					if ( scrollPos <= adminbarHeight ) {
						navbar.removeClass( 'fixed-top' );
						navbar.removeProp( 'top' );
					}
				} else {
					if ( scrollPos > adminbarHeight ) {
						navbar.addClass( 'fixed-top' );
					}
				}
			}
		}

		function fixSkipLink() {
			content.prepend( '<span class="skip-link-target-fix"></span>' );
			offset = content.offset();
			$( '.skip-link-target-fix' )
				.css('padding-top', offset.top )
				.css('margin-top', -offset.top )
				.css('height', offset.top );
			skipLink.focus(function() {
				$( this ).css( 'top', navbarHeight );
			});
		}

		function noAdminbar() {
			if ( navbarTop || navbarBottom ) {
				navbarHeight = navbar.outerHeight();
				if ( navbarTop ) {
					body.css( 'padding-top', navbarHeight );
					fixSkipLink();
				}	else {
					body.css( 'padding-bottom', navbarHeight );
					skipLink.remove();
				}
			}
			width = $(window).width();
		}

		function noAdminbarResize() {
			if ( width != $(window).width() ) {
				noAdminbar();
			}
		}

		function withAdminbar() {
			navbarHeight   = navbar.outerHeight();
			if ( navbarTop ) {
				viewportWidth  = document.documentElement.clientWidth;
				adminbarHeight = adminbar.height();
				getPadding();
				getTop();

				body.css( 'padding-top', padding );
				navbar.css( 'top', top );

				adjustFixedTop();
				fixSkipLink();

				width = $(window).width();
			} else {
				body.css( 'padding-bottom', navbarHeight );
				skipLink.remove();
			}
		}

		function withAdminbarResize() {
			if ( navbarTop ) {
				if ( width != $(window).width() ) {
					withAdminbar();
				}
			}
		}

		if ( navbar.length ) {
			navbarTop    = body.hasClass( 'navbar-fixed-top' );
			navbarBottom = body.hasClass( 'navbar-fixed-bottom' );
			if ( ! adminbar.length ) {
				noAdminbar();
				window.addEventListener( 'resize', noAdminbarResize );
			} else {
				withAdminbar();
				window.addEventListener( 'resize', withAdminbarResize );
				window.addEventListener( 'scroll', withAdminbar );
			}
		}

});
