module Main exposing (main)

import Browser
import Color exposing (Color)
import Css
import Element
import Element.Background as Background
import Html exposing (Html)
import Html.Styled as Styled
import Html.Styled.Attributes as Styled


main : Platform.Program () Model Msg
main =
    Browser.sandbox
        { init = { lights = lights }
        , update = update
        , view = view
        }


type alias Model =
    { lights : List Light }


type alias Light =
    { id : String
    , name : Maybe String
    , tags : List String
    , color : Color
    , position : Position
    }


type alias Position =
    { x : Float, y : Float }


type Msg
    = Increment
    | Decrement


update : Msg -> Model -> Model
update msg model =
    model


view : Model -> Html msg
view model =
    let
        background =
            { url = "https://i.imgur.com/VlFKbRX.png"
            , width = Element.px 1093
            , height = Element.px 1135
            }
    in
    model.lights
        |> List.map (light >> Styled.toUnstyled)
        |> Html.div []
        |> Element.html
        |> Element.el
            [ Element.width background.width
            , Element.height background.height
            , Background.image background.url
            ]
        |> Element.layout [ Background.color (Element.rgb 0 0 0) ]


light : Light -> Styled.Html msg
light { position, color } =
    let
        size =
            300

        offset =
            Css.translate2
                (Css.px (-size / 2))
                (Css.px (-size / 2))

        glow =
            [ ( 0, 100 ), ( 40, 25 ), ( 100, 0 ) ]
                |> List.map gradientStop
                |> String.join ", "
                |> (\stops -> "radial-gradient(closest-side, " ++ stops ++ ")")
                |> Styled.style "background-image"

        gradientStop ( location, alpha ) =
            let
                { red, green, blue } =
                    Color.toRgba color
            in
            Color.toCssString (Color.rgba red green blue (alpha / 100))
                ++ " "
                ++ String.fromInt location
                ++ "%"
    in
    Styled.div
        [ Styled.css
            [ Css.position Css.absolute
            , Css.left (Css.px position.x)
            , Css.top (Css.px position.y)
            , Css.transform offset
            , Css.borderRadius (Css.pc 100)
            ]
        ]
        [ Styled.div
            [ Styled.css
                [ Css.width (Css.px size)
                , Css.height (Css.px size)
                ]
            , glow
            ]
            []
        ]


cssColor : Color -> Css.Color
cssColor color =
    let
        { red, green, blue, alpha } =
            Color.toRgba color
    in
    Css.rgba
        (round (red * 255))
        (round (green * 255))
        (round (blue * 255))
        alpha


lights : List Light
lights =
    let
        toLight ( ( x, y ), tags ) =
            { id = ""
            , name = Nothing
            , tags = tags
            , color = Color.lightRed
            , position = { x = x, y = y }
            }
    in
    List.map toLight <|
        [ ( ( 60, 215 ), [ "office", "desk" ] )
        , ( ( 60, 375 ), [ "office", "desk" ] )
        , ( ( 200, 215 ), [ "office", "lamp" ] )
        , ( ( 295, 350 ), [ "living", "table", "west" ] )
        , ( ( 295, 530 ), [ "living", "table", "east" ] )
        , ( ( 405, 290 ), [ "living", "fireplace", "left" ] )
        , ( ( 480, 290 ), [ "living", "fireplace", "right" ] )
        , ( ( 515, 573 ), [ "living", "tv" ] )
        , ( ( 395, 790 ), [ "living", "entry" ] )
        , ( ( 655, 335 ), [ "dining", "west" ] )
        , ( ( 647, 350 ), [ "dining", "south" ] )
        , ( ( 665, 350 ), [ "dining", "north" ] )
        , ( ( 680, 625 ), [ "kitchen", "cabinets" ] )
        , ( ( 640, 500 ), [ "kitchen", "bar", "north" ] )
        , ( ( 590, 530 ), [ "kitchen", "bar", "south" ] )
        , ( ( 760, 260 ), [ "master", "desk", "plant" ] )
        , ( ( 765, 305 ), [ "master", "desk", "lamp" ] )
        , ( ( 1040, 245 ), [ "master", "bed", "west" ] )
        , ( ( 1040, 430 ), [ "master", "bed", "east" ] )
        , ( ( 880, 630 ), [ "master", "bathroom" ] )
        ]
