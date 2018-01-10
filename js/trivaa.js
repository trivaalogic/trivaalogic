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
   * Height of the navbar, reused at many places.
   */
  const navbarHeight = $('.navbar').outerHeight();

  /**
   * Gets the viewport height.
   * 
   * @return {number} the viewport height
   */
  function viewportHeight() {
    return window.innerHeight;
  }

  /**
   * Scrolls to the specified target element smoothly.
   * 
   * @param {jQuery} target the target element
   * @param {object} center if truthy, the top of the element will be centered on the screen
   */
  function scrollToTarget(target, center) {
    // Calculate the target offset.
    let scrollTargetOffset;
    if (center) scrollTargetOffset = target.offset().top - viewportHeight() / 2;
    else scrollTargetOffset = target.offset().top - navbarHeight;

    // Do the scrolling
    $('html, body').animate({
      scrollTop: scrollTargetOffset
    }, 400);
  }

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
      target = target.length ? target : $('a[name=' + this.hash.slice(1) + ']:visible');

      // Scroll to it.
      if (target.length) scrollToTarget(target, target.data('scroll-center'));
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
    const scrollThreshold = 0;

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
   * Configures the behaviour of the process part on the desktop and the mobile.
   */
  function configureProcessPart() {
    /**
     * Deactivates all the steps which hides the text and resets the circle.
     */
    function deactivateAllSteps() {
      $('.trivaa-process-step').removeClass('active');
    }

    //
    // On the desktop, activate steps when hovering.
    //
    $('.trivaa-process-desktop .trivaa-process-step').on('mouseenter', function () {
      deactivateAllSteps();
      $(this).addClass('active');
    });
    $('.trivaa-process-desktop .trivaa-process-step').on('mouseleave', deactivateAllSteps);

    //
    // On the mobile, activate steps when scrolling near.
    //
    const steps = $('.trivaa-process-mobile .trivaa-process-step');

    /**
     * Activates the nearest step on scroll.
     */
    function activateStepOnScroll() {
      const scrollPosition = $(window).scrollTop() + viewportHeight() / 2 + navbarHeight;
      let activated = false;
      for (let i = 0; i < steps.length; i++) {
        const step = steps.eq(i);
        const offsetTop = step.offset().top;
        const offsetBottom = offsetTop + step.outerHeight();

        if (!activated && offsetTop < scrollPosition && scrollPosition < offsetBottom) {
          activated = true;
          step.addClass('active');
        } else step.removeClass('active');
      }
    }

    // Activate the steps during scrolling, resizing and right away.
    $(window).scroll(activateStepOnScroll).resize(activateStepOnScroll);
    activateStepOnScroll();

    //
    // Scroll smoothly to the step when clicked.
    //
    $('.trivaa-process-step').click(function () {
      scrollToTarget($(this), true);
    });
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
  configureProcessPart();
});