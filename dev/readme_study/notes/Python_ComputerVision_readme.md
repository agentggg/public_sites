# Section 1

- ## What's a pixel
    - Pixel is the smallest unit in an image
        - In a grayscale image, one pixel equal one number (brightness)
            - 0 = black
            - 255 = white
        - In a color image, one pixel equal to three numbers, each is typically from 0-255
            - R (red amount)
            - G (green amount)
            - B (blue amount)
        - Example: 
            1. Color image = `[23,53,32]`
                - red is 23, green is 53, blue is 32 
                    - *this is just one pixel. One pixel has RGB all at the same time. That pixel is some red, some green, and some blue*
            2. Greyscale image = `[ 10 ]` or 10
    - Pixel location
        - Every pixel has a location, similar to an excel sheet or chess board. This is usually identified by `(row, column)` or something similar to `(y, x)`
        - Computer uses the rule of **Origin `(0,0)`** located at the top-left corner of the image. From there `x` increases to the right and `y` increases downward
    - Height and Width:
        - Height is number of rows -> y
        - Width is number of colums -> x
        `image.shape` is usually `(height, width, channels)`
            - Example: `480 pixels tall` `640 pixels wide` `image.shape` would return `(479, 639, 3)`
                - *because indicies does not start at 1, but 0*
- ## What's a channel
    - A <u>channel</u> is one full grid covering the whole image
    - Greyscale image only has one <u>channel</u> with one number per pixel, which meausres brightness only
    - Color image has 3 <u>channel</u> and 3 number per pixel, which measures red, green and blue.
    - Channel is 2D and consist of `channel[row][column]`
    - Each channel answers one question:
        - How red, green, and blue is each pixel
        - Each channel covers the entire image
    - Each channel size is based off of the image size
        - Example:
            1. If the image size is `640 x 480` then the following happens:
                - red channel is `640 x 480`
                - green channel is `640 x 480`
                - blue channel is `640 x 480`
- ## What's a grayscale:
    - The grayscale number is not a random generated number
    - It is created by combining the RGB of the image into one number
        - Human eyes are more sensative to green, less sensative to blue, and red is in between
        - So green contribute more to brightness
    - Algorithm used to determine greyscale number:
        `greyscale = (some red) + (more green) + (less blue)`
    - greyscale keeps the structure, edge and shape but removes the color information
    - Most computer vision algo's prefer greysacle due to the 
        1. Edge
        2. Shape
        3. Motion
        4. Contrast
            * all of these depends on brightness change and not color, so regardless its all about the grayscale and not color because those items are what computer vision uses to determine images, and grayscale only measures brightness. Color adds noise
    - If you are looking for **WHERE** you use index
    - If you are looking for **HOW MANY** you use size
- ## What is ROI (region of intrest)
    - ROI is a subset, focused part of the image defined by a rectangle which is used to focus on what matters
        - Face object, objects area, road area, which is really known as cropping
        - If image is known as `image[y][x]` so cropping would be `image[y1:y2, x1:x2]` 
            - The crop gives you a smaller image, more focused and zoomed
            - Cropping does not create a copy of an image, but it creates a new view into the image
- ## Bounding box
    - A rectangle box draw on a visual image
    - It does not detect by itself, understand objects, or add intelligence
        - it just visualize a region
    - The defination of a bounding box is defined by the following
        - (x1, x2) -> top left corner
        - (y1, y2) -> bottom right corner
            - *this literally matches cropping*
- ## Algorithm Image Scanning
    - Computer scan images differently in comparision to humans
    - Computers scan numbers 
        - For each pixel check something about it, or its neighbors
    - Images are stored in memory from left to right, then next right and repeat - **row-major order**
        - It's faster
        - Matches how arrays are stored
        - Almost all classic CV algorithm assum this
        ```python
        # log(n2): exponential
        for y in range(height):
            for x in range(width):
                process(image[y][x])
        ```
    - **Neighbors** is extremely important as no computer vision program looks at a single pixel. The algo needs to look at its neighbors to determine, which is left, right, up and down
    - **The Simplest Neighborhood** is usually the 8 surrounding pixel, including itself at the middle. Most common one is *3x3* This is a very common pattern in computer. Edges do not have neighbors.
    - **Kernel** tells the algo what to do with each pixel. It uses the same format as neighborhood, but instead of pixels it uses weight. 
        - It takes the same 3x3 or 5x5 format of the pixels and then places the weight chart on top of it, in same format, and then from there it multiplies each neighbor by its weight add the results and stores the result as a new pixel value. This is how we determine how important is each neighbor. This is called **convolution**
    - **Blue Kernel** All neighbors are treated equally, average everything, smooth the image and remove noise
    - **Edge Kernel** Some neighbors are added and some subtracted which would Emphasize differences, Highlight edges, Detect boundaries
