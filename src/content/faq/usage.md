---
title: Usage
order: 2
lastUpdated: July 9, 2026
---

### Where can I use JPEG XL images?

JPEG XL is well-suited for applications where both image quality and file size are critical, including websites, photography, and graphic design. It enjoys wide support within the Apple ecosystem, Adobe’s photography tools, and various image libraries. For a comprehensive list of supported platforms, refer to [this Github page.](https://github.com/libjxl/libjxl/blob/main/doc/software_support.md)
- - -

### What are JPEG XL’s limitations?

While JPEG XL offers numerous benefits, there are some limitations to consider. The most significant limitation is that browser support for JPEG XL is still evolving, meaning not all browsers can display JPEG XL images natively. Additionally, some existing image editing software might not yet offer native support for JPEG XL, requiring updates or plugins to handle the format. Therefore, users may need to rely on compatible software and browsers to fully utilize JPEG XL’s capabilities.
- - -

### Can I use JPEG XL on my web browser?

Support for JPEG XL in web browsers is still evolving. Most modern browsers offer support, but it’s not yet universally adopted. It’s fully supported in Safari, Thorium, Basilisk, Pale Moon, and Waterfox. Support behind a flag was added in Chrome version 145 and Firefox version 152. You can check [https://caniuse.com/jpegxl](https://caniuse.com/jpegxl) for the latest browser compatibility information.

Leverage the `<picture>` element to deliver JXL images to browsers that support them, while ensuring fallback for other browsers:
```html
<picture>
   <source srcset="photo.jxl" type="image/jxl">
   <source srcset="photo.webp" type="image/webp">
   <img src="photo.jpg" />
</picture>
```
- - -

### How can I learn more about using JPEG XL?

jpegxl.info offers documentation, tutorials, resources to help you learn more about using JPEG XL format. You can also find many links to relevant articles and tools on the site.

The official JPEG committee JPEG XL site can be found here: [https://jpeg.org/jpegxl/](https://jpeg.org/jpegxl/)

There is a [subreddit about JPEG XL](https://www.reddit.com/r/jpegxl/), and informal chatting with developers and early adopters of `libjxl` can be done on the [JPEG XL Discord server](https://discord.gg/DqkQgDRTFu).
- - -

### How do I report issues or bugs with JPEG XL?

You can report issues or bugs with JPEG XL to the JPEG XL community of developers through its [Github page.](https://github.com/libjxl/libjxl/issues)
- - -
