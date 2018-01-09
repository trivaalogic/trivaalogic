"use strict";

$(function () {
  /**
   * Mobile Browser Address-bar Resize Jump Fix.
   *
   * Prevent items with a height depending on the viewport from jumping if the
   * mobile browser address bar appreas/disappears.
   * This fixes the address-bar viewport resize jump problem of many mobile
   * Browsers.
   *
   * Usage:
   *
   *   Put this data attribute: "data-jump-fix" on each html element that has
   *   height depending on the vp height.
   *
   *   load the script and call JumpFix.init()
   *
   */
  const JumpFix = {
    fixItems: $('*[data-jump-fix]'), // Get all items with the data attribute.
    isScrolling: false,
    timeoutScroll: null,

    // This sets 'isScrolling' to true for a certain amount of time.
    setScrollingStatus: function () {
      if (JumpFix.timeoutScroll) {
        clearTimeout(JumpFix.timeoutScroll);
      }
      JumpFix.isScrolling = true;
      JumpFix.timeoutScroll = setTimeout(function () {
        JumpFix.isScrolling = false;
      }, 100);
    },

    // Save actual heights
    saveHeights: function () {
      JumpFix.fixItems.each(function (i) {
        JumpFix.fixItems[i].savedHeight = $(this).height();
      })
    },

    // window and document actions here
    bindUIActions: function () {

      // Set isScrolling when the user scrolls or swipes.
      $(window).scroll(function () {
        if (JumpFix.isScrolling === false) {
          JumpFix.saveHeights();
        }
        JumpFix.setScrollingStatus();
      });

      $(window).on({
        'touchmove': function () {
          if (JumpFix.isScrolling === false) {
            JumpFix.saveHeights();
          }
          JumpFix.setScrollingStatus();
        }
      });

      // On resize: if user is scrolling use the saved height.
      // if user is NOT scrolling save the new nativ height after resize.
      $(window).resize(function () {
        if (JumpFix.isScrolling === true) {
          JumpFix.fixItems.each(function (i) {
            $(this).height(JumpFix.fixItems[i].savedHeight);
          })
        } else {
          JumpFix.fixItems.each(function () {
            $(this).css('height', '');
          });
        }
      });
    },

    init: function () {
      this.bindUIActions();
    }
  };

  /**
   * Configures smooth scroll of inner links within the specified container. Makes sure the location is not updated with the
   * hashtag of the anchor.
   * 
   * @param container
   *            JQuery object pointing to the container(s) in which to look for anchors
   */
  function configureScrollToTarget(container) {
    container.find('a[href*="#"]:not([href="#"])').off('click').click(function (e) {
      // This prevents the update of the location bar.
      e.preventDefault();

      // Find the target anchor.
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');

      // Scroll to it.
      if (target.length) {
        var scrollTargetOffset = target.offset().top - $('.navbar').outerHeight();
        $('html, body').animate({
          scrollTop: scrollTargetOffset
        }, 400);
      }
    });
  }

  /**
   * Configures the navbar so that it closes on the mobile automatically when an item is selected.
   */
  function configureMobileNavbar() {
    const navbarToggler = $('button.navbar-toggler');
    $('nav.navbar a.nav-link').click(() => {
      if (navbarToggler.is(':visible')) navbarToggler.click();
    });

    const navbar = $('nav.navbar');
    const navbarCollapse = navbar.find('div.navbar-collapse');
    const hammerTime = new Hammer(navbar.get(0), {
      recognizers: [
        [Hammer.Swipe, {
          direction: Hammer.DIRECTION_VERTICAL
        }]
      ]
    });
    hammerTime.on('swipe', function (e) {
      let visible = navbarCollapse.is(':visible');
      if (e.direction == Hammer.DIRECTION_UP && visible || e.direction == Hammer.DIRECTION_DOWN && !visible) navbarToggler.click();
    });
  }

  /**
   * Sets up the navbar so that it dims when scrolled a little or when the toggler is activated..
   */
  function configureDimmingNavbar() {
    const scrollThreshold = 50;

    const navbar = $('nav.navbar');
    const navbarCollapse = navbar.find('div.navbar-collapse');
    const navbarToggler = $('button.navbar-toggler');

    $(window).scroll(() => {
      if ($(window).scrollTop() > scrollThreshold) navbar.addClass('trivaa-dimmed-navbar');
      else if (!navbarToggler.is(':visible') || !navbarCollapse.is(':visible')) navbar.removeClass('trivaa-dimmed-navbar');
    });

    navbarToggler.click(() => {
      let visible = navbarCollapse.is(':visible');
      if (!visible) navbar.addClass('trivaa-dimmed-navbar');
      else if (visible && $(window).scrollTop() <= scrollThreshold) navbar.removeClass('trivaa-dimmed-navbar');
    });
  }

  /**
   * Configures the behaviour of the process part on the desktop.
   */
  function configureProcessPartOnDesktop() {
  }

  /**
   * Page initialization.
   */

  // Initialize the mobile browser 'address bar jump' fix.
  JumpFix.init();

  // Configure smooth scrolling.
  configureScrollToTarget($('html, body'));

  // Show the page.
  $('.no-fouc').removeClass('no-fouc');

  // Configure the navbar for mobile-specific behaviour.
  configureMobileNavbar();

  // Configure the navbar to dim when needed.
  configureDimmingNavbar();

  // Configure the process part of the page.
  configureProcessPartOnDesktop();
});